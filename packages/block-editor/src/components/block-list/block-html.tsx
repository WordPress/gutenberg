import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { getBlockContent } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { useNativeUndo } from '../../utils/native-undo';
import getBlockHTMLUpdate from './get-block-html-update';
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
		const update = getBlockHTMLUpdate( block, html );

		if ( ! update ) {
			return;
		}

		updateBlock( clientId, update );

		// Ensure the state is updated if we reset so it displays the default content.
		if ( ! html ) {
			setHtml( update.originalContent );
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
