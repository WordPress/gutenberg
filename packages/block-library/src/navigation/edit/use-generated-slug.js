/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

function useGeneratedSlug( clientId ) {
	const slug = useSelect(
		( select ) => {
			// Use the lack of a clientId as an opportunity to bypass the rest
			// of this hook.
			if ( ! clientId ) {
				return;
			}

			const { getBlock, getBlockParentsByBlockName } =
				select( blockEditorStore );

			// Get all/any Template Parts that are parents of this Nav block.
			const withAscendingResults = true;
			const parentTemplatePartClientIds = getBlockParentsByBlockName(
				clientId,
				'core/template-part',
				withAscendingResults
			);

			// Use the slug of the immediate parent if found.
			return getBlock( parentTemplatePartClientIds[ 0 ] )?.attributes
				?.slug;
		},
		[ clientId ]
	);

	return slug;
}

export default useGeneratedSlug;
