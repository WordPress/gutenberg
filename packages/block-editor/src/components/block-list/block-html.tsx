import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	getBlockAttributes,
	getBlockContent,
	getBlockType,
	getSaveContent,
	validateBlock,
	VALIDATION_LEVEL,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { useNativeUndo } from '../../utils/native-undo';
import type { TreeBlock } from '../../store/types';

function BlockHTML( { clientId }: { clientId: string } ) {
	const [ html, setHtml ] = useState( '' );
	const nativeUndoRef = useNativeUndo();
	const block = useSelect(
		// The HTML editor only renders for an existing block.
		( select ) =>
			select( blockEditorStore ).getBlock( clientId ) as TreeBlock,
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

		// Only an exact match is accepted for markup typed by the user:
		// regenerating the block from its attributes would silently rewrite
		// the edit, and deprecations are only applied when the block is
		// parsed again (e.g. via "Attempt recovery").
		const validationLevel = html
			? validateBlock( {
					...block,
					attributes,
					originalContent: content,
				} )[ 2 ].validationLevel
			: VALIDATION_LEVEL.VALID_BLOCK;
		const isValid = validationLevel === VALIDATION_LEVEL.VALID_BLOCK;

		updateBlock( clientId, {
			attributes,
			originalContent: content,
			isValid,
			validationLevel: isValid
				? VALIDATION_LEVEL.VALID_BLOCK
				: VALIDATION_LEVEL.INVALID_BLOCK,
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
