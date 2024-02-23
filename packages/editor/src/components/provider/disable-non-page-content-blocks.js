/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

function useDisableNonPageContentBlocks() {
	const contentIds = useSelect(
		( select ) => unlock( select( editorStore ) ).getPageContentBlocks(),
		[]
	);
	const { setBlockEditingMode, unsetBlockEditingMode } =
		useDispatch( blockEditorStore );
	useEffect( () => {
		setBlockEditingMode( '', 'disabled' ); // Disable editing at the root level.
		for ( const contentId of contentIds ) {
			setBlockEditingMode( contentId, 'contentOnly' ); // Re-enable each content block.
		}
		return () => {
			unsetBlockEditingMode( '' );
			for ( const contentId of contentIds ) {
				unsetBlockEditingMode( contentId );
			}
		};
	}, [ contentIds, setBlockEditingMode, unsetBlockEditingMode ] );
}

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	useDisableNonPageContentBlocks();
}
