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
import TextWithColorIndicators from '../text-with-color-indicators';
import withColorContext from '../color-palette/with-color-context';

export function PanelColorSettings( { title, colorSettings, children, ...props } ) {
	const className = 'editor-panel-color-settings';

	const titleElement = (
		<TextWithColorIndicators
			className={ `${ className }__panel-title` }
			colorSettings={ colorSettings }
		>
			{ title }
		</TextWithColorIndicators>
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
