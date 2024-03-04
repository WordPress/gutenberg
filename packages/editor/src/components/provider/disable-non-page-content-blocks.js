/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

const PAGE_CONTENT_BLOCKS = [
	'core/post-title',
	'core/post-featured-image',
	'core/post-content',
];

function useDisableNonPageContentBlocks() {
	const contentIds = useSelect( ( select ) => {
		const { getBlocksByName, getBlockParents, getBlockName } =
			select( blockEditorStore );
		return getBlocksByName( PAGE_CONTENT_BLOCKS ).filter( ( clientId ) =>
			getBlockParents( clientId ).every( ( parentClientId ) => {
				const parentBlockName = getBlockName( parentClientId );
				return (
					parentBlockName !== 'core/query' &&
					! PAGE_CONTENT_BLOCKS.includes( parentBlockName )
				);
			} )
		);
	}, [] );

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
