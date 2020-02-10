/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

export default createHigherOrderComponent(
	withSelect( ( select, ownProps ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		const colors =
			ownProps.colors === undefined ? settings.colors : ownProps.colors;

		const disableCustomColors =
			ownProps.disableCustomColors === undefined
				? settings.disableCustomColors
				: ownProps.disableCustomColors;
		return {
			colors,
			disableCustomColors,
			hasColorsToChoose: ! isEmpty( colors ) || ! disableCustomColors,
		};
	} ),
	'withColorContext'
);
