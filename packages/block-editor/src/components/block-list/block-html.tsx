import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import {
	getBlockAttributes,
	getBlockContent,
	getBlockType,
	getSaveContent,
	privateApis as blocksPrivateApis,
	serialize,
	validateBlock,
} from '@wordpress/blocks';
import type { Block, BlockType } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useNativeUndo } from '../../utils/native-undo';
import type { TreeBlock } from '../../store/types';

const { applyBuiltInValidationFixes, getCommentAttributes, parseRawBlock } =
	unlock( blocksPrivateApis );

function BlockHTML( { clientId }: { clientId: string } ) {
	const [ html, setHtml ] = useState( '' );
	const nativeUndoRef = useNativeUndo();
	const block = useSelect(
		// The HTML editor only renders for an existing block.
		( select ) =>
			select( blockEditorStore ).getBlock( clientId ) as TreeBlock,
		[ clientId ]
	);
	const registry = useRegistry();
	const { updateBlock, replaceInnerBlocks } = useDispatch( blockEditorStore );

	// Derive block content as a primitive string so the effect only fires
	// when the serialized content genuinely changes, not when the block
	// object reference changes (which happens on every RESET_BLOCKS during
	// RTC sync, even for unchanged blocks).
	const blockContent = useMemo(
		() => ( block ? getBlockContent( block ) : '' ),
		[ block ]
	);

	// The HTML of a block with inner blocks holds their delimited markup,
	// which the block's own validation doesn't expect. Parse it the way it is
	// parsed on load instead, so the inner blocks are split out. Returns false
	// when the HTML can't be applied this way.
	const updateWithInnerBlocks = ( blockType: BlockType ) => {
		// The parser closes blocks without matching their names, and closes
		// unclosed ones at the end of the input. The trailing newline only
		// comes back on its own if the block was closed by its own closer.
		const rawBlocks = grammarParse(
			`<!-- wp:${ block.name } -->${ html }<!-- /wp:${ block.name } -->\n`
		);
		const [ rawBlock, trailing ] = rawBlocks;
		if (
			rawBlocks.length !== 2 ||
			rawBlock.blockName !== block.name ||
			trailing.blockName !== null ||
			trailing.innerHTML !== '\n'
		) {
			return false;
		}

		const parsedBlock = parseRawBlock( {
			...rawBlock,
			attrs: getCommentAttributes( blockType, block.attributes ),
		} );

		if ( ! parsedBlock || parsedBlock.name !== block.name ) {
			return false;
		}

		// Keep the inner blocks, and their client IDs, unless they changed.
		const hasInnerBlocksChange =
			serialize( parsedBlock.innerBlocks ) !==
			serialize( block.innerBlocks );

		if ( hasInnerBlocksChange ) {
			const {
				areInnerBlocksControlled,
				canEditBlock,
				canInsertBlockType,
				canMoveBlock,
				canRemoveBlock,
				getBlockEditingMode,
				getTemplateLock,
			} = registry.select( blockEditorStore );
			const getClientIds = ( blocks: TreeBlock[] ): string[] =>
				blocks.flatMap( ( innerBlock ) => [
					innerBlock.clientId,
					...getClientIds( innerBlock.innerBlocks ),
				] );

			// The inner blocks are replaced as a whole, so they can't belong to
			// an entity, and nothing in them can be locked in any way.
			const canReplaceInnerBlocks =
				! areInnerBlocksControlled( clientId ) &&
				! getTemplateLock( clientId ) &&
				getClientIds( block.innerBlocks ).every(
					( id ) =>
						! getTemplateLock( id ) &&
						canRemoveBlock( id ) &&
						canMoveBlock( id ) &&
						canEditBlock( id ) &&
						getBlockEditingMode( id ) === 'default'
				) &&
				parsedBlock.innerBlocks.every( ( { name }: Block ) =>
					canInsertBlockType( name, clientId )
				);

			if ( ! canReplaceInnerBlocks ) {
				return false;
			}
		}

		// Local attributes aren't part of the comment, so carry them over.
		const nextAttributes = { ...parsedBlock.attributes };
		for ( const [ key, schema ] of Object.entries(
			blockType.attributes ?? {}
		) ) {
			if (
				schema.role === 'local' ||
				schema.__experimentalRole === 'local'
			) {
				nextAttributes[ key ] = block.attributes[ key ];
			} else if ( ! ( key in nextAttributes ) ) {
				nextAttributes[ key ] = undefined;
			}
		}

		registry.batch( () => {
			updateBlock( clientId, {
				attributes: nextAttributes,
				originalContent: parsedBlock.originalContent,
				isValid: parsedBlock.isValid,
				validationIssues: parsedBlock.validationIssues,
				// Set while invalid, so the block is saved as typed, the same
				// as a block that is invalid on load.
				__unstableBlockSource: parsedBlock.__unstableBlockSource,
			} );

			if ( hasInnerBlocksChange ) {
				replaceInnerBlocks( clientId, parsedBlock.innerBlocks );
			}
		} );

		return true;
	};

	const onChange = () => {
		// Blur fires whether or not anything was typed, so an untouched visit
		// would otherwise rewrite the block and mark the post dirty.
		if ( html === blockContent ) {
			return;
		}

		const blockType = getBlockType( block.name );

		if ( ! blockType ) {
			return;
		}

		if (
			html.trim() &&
			block.innerBlocks.length &&
			updateWithInnerBlocks( blockType )
		) {
			return;
		}

		const attributes = getBlockAttributes(
			blockType,
			html,
			block.attributes
		);

		// If html is empty  we reset the block to the default HTML and mark it as valid to avoid triggering an error
		const content = html ? html : getSaveContent( blockType, attributes );

		const updatedBlock = {
			...block,
			attributes,
			originalContent: content,
		};
		const [ isValid ] = html ? validateBlock( updatedBlock ) : [ true ];

		// `getBlockAttributes` only sources what the save output declares,
		// so recover hand-typed `id`/`class`/`aria-label` for invalid blocks.
		const fixedBlock = isValid
			? updatedBlock
			: applyBuiltInValidationFixes( updatedBlock, blockType );

		// `updateBlock` merges attributes, so one the fixes dropped — an `id`,
		// `class` or `aria-label` deleted by hand — only clears if it is sent
		// explicitly as `undefined`.
		const nextAttributes = { ...fixedBlock.attributes };
		for ( const key of Object.keys( attributes ) ) {
			if ( ! ( key in nextAttributes ) ) {
				nextAttributes[ key ] = undefined;
			}
		}

		updateBlock( clientId, {
			attributes: nextAttributes,
			originalContent: content,
			isValid: isValid || validateBlock( fixedBlock )[ 0 ],
		} );

		// Ensure the state is updated if we reset so it displays the default
		// content. Inner blocks are kept, so it has to show them too, or the
		// next blur would remove them.
		if ( ! html ) {
			const resetBlock = { ...block, attributes: nextAttributes };
			setHtml(
				block.innerBlocks.length
					? getBlockContent( resetBlock )
					: content
			);
		}
	};

	useEffect( () => {
		setHtml( blockContent );
	}, [ blockContent ] );

	return (
		<textarea
			className="block-editor-block-list__block-html-textarea"
			value={ html }
			onBlur={ onChange }
			onChange={ ( event ) => setHtml( event.target.value ) }
			// The edits are local state until committed on blur, so undo
			// and redo must remain the browser's own within the field.
			ref={ nativeUndoRef }
		/>
	);
}

export default BlockHTML;
