/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PanelColorSettings from '../components/panel-color-settings';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';
import { getBlockDOMNode } from '../utils/dom';

export default function ColorPanel( { colorSettings, clientId } ) {
	const { getComputedStyle, Node } = window;

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();

	useEffect( () => {
		const colorsDetectionElement = getBlockDOMNode( clientId );
		setDetectedColor( getComputedStyle( colorsDetectionElement ).color );

		let backgroundColorNode = colorsDetectionElement;
		let backgroundColor = getComputedStyle( backgroundColorNode )
			.backgroundColor;
		while (
			backgroundColor === 'rgba(0, 0, 0, 0)' &&
			backgroundColorNode.parentNode &&
			backgroundColorNode.parentNode.nodeType === Node.ELEMENT_NODE
		) {
			backgroundColorNode = backgroundColorNode.parentNode;
			backgroundColor = getComputedStyle( backgroundColorNode )
				.backgroundColor;
		}

		setDetectedBackgroundColor( backgroundColor );
	} );

	return (
		<InspectorControls>
			<PanelColorSettings
				title={ __( 'Color settings' ) }
				initialOpen={ false }
				colorSettings={ colorSettings }
			>
				<ContrastChecker
					backgroundColor={ detectedBackgroundColor }
					textColor={ detectedColor }
				/>
			</PanelColorSettings>
		</InspectorControls>
	);
}
