/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function EditContentsButton( { clientId } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { attributes } = useSelect(
		( select ) => {
			return {
				attributes:
					select( blockEditorStore ).getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);

	if ( ! attributes?.metadata?.patternName ) {
		return null;
	}

	return (
		<Button
			className="block-editor-block-inspector-edit-contents-button"
			__next40pxDefaultSize
			variant="secondary"
			onClick={ () => {
				const { patternName, ...metadataWithoutPatternName } =
					attributes?.metadata ?? {};
				updateBlockAttributes( clientId, {
					...attributes,
					metadata: metadataWithoutPatternName,
				} );
			} }
		>
			{ __( 'Edit contents' ) }
		</Button>
	);
}
