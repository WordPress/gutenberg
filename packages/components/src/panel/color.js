/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PanelBody from './body';
import ColorIndicator from '../color-indicator';

function PanelColor( { colorValue, colorName, title, ...props } ) {
	// translators: %s: The name of the color e.g: "vivid red" or color hex code if name is not available e.g: "#f00".
	const currentColorLabel = sprintf( __( '(current color: %s)' ), colorName || colorValue );
	return (
		<PanelBody
			{ ...props }
			title={ [
				<span className="components-panel__color-title" key="title">{ title }</span>,
				colorValue && (
					<ColorIndicator
						key="color"
						className="components-panel__color-indicator"
						aria-label={ currentColorLabel }
						colorValue={ colorValue }
					/>
				),
			] }
		/>
	);
}

export default PanelColor;
