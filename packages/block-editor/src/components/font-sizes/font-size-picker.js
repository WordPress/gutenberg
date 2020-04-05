/**
 * WordPress dependencies
 */
import { FontSizePicker } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

export default withSelect( ( select ) => {
	const { disableCustomFontSizes, fontSizes } = select(
		'core/block-editor'
	).getSettings();

	return {
		disableCustomFontSizes,
		fontSizes,
	};
} )( FontSizePicker );
