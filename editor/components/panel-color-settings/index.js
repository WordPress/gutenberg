/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	PanelBody,
} from '@wordpress/components';
import { ifCondition, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './style.scss';
import ColorPaletteControl from '../color-palette/control';
import withColorContext from '../color-palette/with-color-context';
import ColorIndicator from '../color-indicator';

export function PanelColorSettings( { title, colorSettings, children, ...props } ) {
	const className = 'editor-panel-color-settings';

	const titleElement = (
		<span className={ `${ className }__panel-title` }>
			{ title }
			{ colorSettings.map( ( settings, index ) => (
				<ColorIndicator
					key={ index }
					colorValue={ settings.value }
					ariaLabel={ settings.colorIndicatorAriaLabel }
				/>
			) ) }
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
