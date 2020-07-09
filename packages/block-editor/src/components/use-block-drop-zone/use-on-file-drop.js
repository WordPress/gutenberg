/**
 * WordPress dependencies
 */
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

export default function useOnFileDrop( rootClientId, blockIndex ) {
	const hasUploadPermissions = useSelect(
		( select ) =>
			!! select( 'core/block-editor' ).getSettings().mediaUpload,
		[]
	);

	const { insertBlocks, updateBlockAttributes } = useDispatch(
		'core/block-editor'
	);

	return ( files ) => {
		if ( ! hasUploadPermissions ) {
			return;
		}

		const transformation = findTransform(
			getBlockTransforms( 'from' ),
			( transform ) =>
				transform.type === 'files' && transform.isMatch( files )
		);

		if ( transformation ) {
			const blocks = transformation.transform(
				files,
				updateBlockAttributes
			);
			insertBlocks( blocks, blockIndex, rootClientId );
		}
	};
}
