/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useImageEditingContext } from './context';

export default function CropToContentButton() {
	const { applyCropToContent, hasCropToContentBounds } =
		useImageEditingContext();

	if ( ! hasCropToContentBounds ) {
		return null;
	}

	return (
		<ToolbarButton onClick={ applyCropToContent }>
			{ __( 'Crop to content' ) }
		</ToolbarButton>
	);
}
