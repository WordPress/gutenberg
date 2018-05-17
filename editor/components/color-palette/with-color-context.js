
/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { deprecated } from '@wordpress/utils';
import { createHigherOrderComponent } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

export default createHigherOrderComponent(
	withSelect(
		( select, ownProps ) => {
			if ( ownProps.colors || ownProps.disableCustomColors ) {
				deprecated( 'Passing props "colors" or "disableCustomColors" to @editor/PanelColor or @editor/ColorPalette', {
					version: '2.9',
					alternative: 'remove the props and rely on the editor settings or use @wordpress/PanelColor and @wordpress/ColorPalette',
				} );
			}
			const settings = select( 'core/editor' ).getEditorSettings();
			const colors = ownProps.colors || settings.colors;
			const disableCustomColors = ownProps.disableCustomColors || settings.disableCustomColors;
			return {
				colors,
				disableCustomColors,
				hasColorsToChoose: ! isEmpty( colors ) || ! disableCustomColors,
			};
		}
	),
	'withColorContext'
);
