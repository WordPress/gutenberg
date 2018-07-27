/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, ColorIndicator } from '@wordpress/components';
import { ifCondition, compose } from '@wordpress/compose';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorPaletteControl from '../color-palette/control';
import withColorContext from '../color-palette/with-color-context';
import { getColorName } from '../colors';

// translators: first %s: The type of color (e.g. background color), second %s: the color name or value (e.g. red or #ff0000)
const colorIndicatorAriaLabel = __( '(%s: %s)' );

const renderColorIndicators = ( colorSettings, colors ) => {
	return colorSettings.map( ( { value, label }, index ) => {
		if ( ! value ) {
			return null;
		}

		const colorName = getColorName( colors, value );
		const ariaLabel = sprintf( colorIndicatorAriaLabel, label.toLowerCase(), colorName || value );

		return (
			<ColorIndicator
				key={ index }
				colorValue={ value }
				aria-label={ ariaLabel }
			/>
		);
	} );
};

// colorSettings is passed as an array of props so that it can be used for
// mapping both ColorIndicator and ColorPaletteControl components. Passing
// an array of components/nodes here wouldn't be feasible.
export function PanelColorSettings( { title, colorSettings, colors, children, ...props } ) {
	const className = 'editor-panel-color-settings';

	const titleElement = (
		<span className={ `${ className }__panel-title` }>
			{ title }
			{ renderColorIndicators( colorSettings, colors ) }
		</span>
	);

	return (
		<PanelBody
			className={ className }
			title={ titleElement }
			{ ...omit( props, 'colors' ) }
		>
			{ colorSettings.map( ( settings, index ) => (
				<ColorPaletteControl key={ index } { ...settings } />
			) ) }

			{ children }
		</PanelBody>
	);
}

export default compose( [
	withColorContext,
	ifCondition( ( { hasColorsToChoose } ) => hasColorsToChoose ),
] )( PanelColorSettings );
