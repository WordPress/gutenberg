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
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';

const EMPTY_OBJECT = {};
const DISABLE_GRADIENT_SETTINGS = {
	disableCustomGradients: true,
	gradients: [],
};

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function ColorPanel( {
	settings,
	hasGradient,
	clientId,
	enableContrastChecking = true,
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const ref = useBlockRef( clientId );

	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}

		if ( ! ref.current ) {
			return;
		}
		setDetectedColor( getComputedStyle( ref.current ).color );

		let backgroundColorNode = ref.current;
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
				{ ...( hasGradient
					? EMPTY_OBJECT
					: DISABLE_GRADIENT_SETTINGS ) }
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
