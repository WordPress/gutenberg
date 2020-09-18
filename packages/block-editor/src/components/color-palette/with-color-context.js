/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useEditorFeature from '../use-editor-feature';

const withDisableCustomColors = createHigherOrderComponent(
	( WrappedComponent ) => {
		return ( props ) => {
			const disableCustomColors = ! useEditorFeature( 'color.custom' );

			return (
				<WrappedComponent
					{ ...props }
					disableCustomColors={
						props.disableCustomColors || disableCustomColors
					}
				/>
			);
		};
	},
	'withDisableCustomColors'
);

export default createHigherOrderComponent(
	compose(
		withDisableCustomColors,
		withSelect( ( select, ownProps ) => {
			const settings = select( 'core/block-editor' ).getSettings();
			const colors =
				ownProps.colors === undefined
					? settings.colors
					: ownProps.colors;

			return {
				colors,
				hasColorsToChoose:
					! isEmpty( colors ) || ! ownProps.disableCustomColors,
			};
		} )
	),
	'withColorContext'
);
