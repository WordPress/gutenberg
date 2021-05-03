/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../components/colors-gradients/panel-color-gradient-settings';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';
import { getBlockDOMNode } from '../utils/dom';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function ColorPanel( {
	settings,
	clientId,
	enableContrastChecking = true,
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();

	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}

		const colorsDetectionElement = getBlockDOMNode( clientId, document );
		if ( ! colorsDetectionElement ) {
			return;
		}
		setDetectedColor( getComputedStyle( colorsDetectionElement ).color );

		let backgroundColorNode = colorsDetectionElement;
		let backgroundColor = getComputedStyle( backgroundColorNode )
			.backgroundColor;
		while (
			backgroundColor === 'rgba(0, 0, 0, 0)' &&
			backgroundColorNode.parentNode &&
			backgroundColorNode.parentNode.nodeType ===
				backgroundColorNode.parentNode.ELEMENT_NODE
		) {
			backgroundColorNode = backgroundColorNode.parentNode;
			backgroundColor = getComputedStyle( backgroundColorNode )
				.backgroundColor;
		}

		setDetectedBackgroundColor( backgroundColor );
	} );

	return (
		<InspectorControls>
			<PanelColorGradientSettings
				title={ __( 'Color' ) }
				initialOpen={ false }
				settings={ settings }
			>
				{ enableContrastChecking && (
					<ContrastChecker
						backgroundColor={ detectedBackgroundColor }
						textColor={ detectedColor }
					/>
				) }
			</PanelColorGradientSettings>
		</InspectorControls>
	);
}
