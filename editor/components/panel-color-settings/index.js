/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, ColorIndicator } from '@wordpress/components';
import { ifCondition, compose } from '@wordpress/compose';
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import ColorPaletteControl from '../color-palette/control';
import withColorContext from '../color-palette/with-color-context';
import { getColorName } from '../colors';

const renderColorIndicators = ( colorSettings, colors ) => {
	return colorSettings.map( ( { value, colorIndicatorAriaLabel }, index ) => {
		if ( ! value ) {
			return null;
		}

		let ariaLabel;
		if ( colorIndicatorAriaLabel ) {
			const colorName = getColorName( colors, value );
			ariaLabel = sprintf( colorIndicatorAriaLabel, colorName || value );
		}

		return (
			<ColorIndicator
				key={ index }
				colorValue={ value }
				aria-label={ ariaLabel }
			/>
		);
	} );
};

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
