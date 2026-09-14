import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	getBlockAttributes,
	getBlockContent,
	getBlockType,
	getSaveContent,
	privateApis as blocksPrivateApis,
	validateBlock,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useNativeUndo } from '../../utils/native-undo';

const { applyBuiltInValidationFixes } = unlock( blocksPrivateApis );

function BlockHTML( { clientId } ) {
	const [ html, setHtml ] = useState( '' );
	const nativeUndoRef = useNativeUndo();
	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);
	const { updateBlock } = useDispatch( blockEditorStore );

	// Derive block content as a primitive string so the effect only fires
	// when the serialized content genuinely changes, not when the block
	// object reference changes (which happens on every RESET_BLOCKS during
	// RTC sync, even for unchanged blocks).
	const blockContent = useMemo(
		() => ( block ? getBlockContent( block ) : '' ),
		[ block ]
	);

	const onChange = () => {
		const blockType = getBlockType( block.name );

		if ( ! blockType ) {
			return;
		}

		const attributes = getBlockAttributes(
			blockType,
			html,
			block.attributes
		);

		// If html is empty  we reset the block to the default HTML and mark it as valid to avoid triggering an error
		const content = html ? html : getSaveContent( blockType, attributes );

		let updatedAttributes = attributes;
		let isValid = true;

		if ( html ) {
			// `getBlockAttributes` only sources what the save output declares,
			// so recover hand-typed `id`/`class`/`aria-label` as the parser does.
			const fixedBlock = applyBuiltInValidationFixes(
				{ ...block, attributes, originalContent: content },
				blockType
			);
			updatedAttributes = fixedBlock.attributes;
			[ isValid ] = validateBlock( fixedBlock );
		}

		updateBlock( clientId, {
			attributes: updatedAttributes,
			originalContent: content,
			isValid,
		} );

		// Ensure the state is updated if we reset so it displays the default content.
		if ( ! html ) {
			setHtml( content );
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
