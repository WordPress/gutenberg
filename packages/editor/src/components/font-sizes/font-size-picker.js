/**
 * WordPress dependencies
 */
import { FontSizePicker } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

export default withSelect(
	( select ) => {
		const { fontSizes } = select( 'core/editor' ).getEditorSettings();
		return {
			fontSizes,
		};
	}
)( FontSizePicker );
