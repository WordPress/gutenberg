/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../components/colors-gradients/panel-color-gradient-settings';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function ColorPanel( {
	enableAlpha = false,
	settings,
	clientId,
	enableContrastChecking = true,
	showTitle = true,
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [ detectedLinkColor, setDetectedLinkColor ] = useState();
	const ref = useBlockRef( clientId );

	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}

		if ( ! ref.current ) {
			return;
		}
		setDetectedColor( getComputedStyle( ref.current ).color );

		const firstLinkElement = ref.current?.querySelector( 'a' );
		if ( firstLinkElement && !! firstLinkElement.innerText ) {
			setDetectedLinkColor( getComputedStyle( firstLinkElement ).color );
		}

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
				showTitle={ showTitle }
				enableAlpha={ enableAlpha }
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
			>
				{ enableContrastChecking && (
					<ContrastChecker
						backgroundColor={ detectedBackgroundColor }
						textColor={ detectedColor }
						enableAlphaChecker={ enableAlpha }
						linkColor={ detectedLinkColor }
					/>
				) }
			</PanelColorGradientSettings>
		</InspectorControls>
	);
}
