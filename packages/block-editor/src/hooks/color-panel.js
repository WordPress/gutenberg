/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorGradientSettingsDropdown from '../components/colors-gradients/dropdown';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';
import useMultipleOriginColorsAndGradients from '../components/colors-gradients/use-multiple-origin-colors-and-gradients';
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function ColorPanel( {
	enableAlpha = false,
	settings,
	clientId,
	enableContrastChecking = true,
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [ detectedLinkColor, setDetectedLinkColor ] = useState();
	const ref = useBlockRef( clientId );
	const definedColors = settings.filter( ( setting ) => setting?.colorValue );

	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}
		if ( ! definedColors.length ) {
			if ( detectedBackgroundColor ) {
				setDetectedBackgroundColor();
			}
			if ( detectedColor ) {
				setDetectedColor();
			}
			if ( detectedLinkColor ) {
				setDetectedColor();
			}
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
		let backgroundColor =
			getComputedStyle( backgroundColorNode ).backgroundColor;
		while (
			backgroundColor === 'rgba(0, 0, 0, 0)' &&
			backgroundColorNode.parentNode &&
			backgroundColorNode.parentNode.nodeType ===
				backgroundColorNode.parentNode.ELEMENT_NODE
		) {
			backgroundColorNode = backgroundColorNode.parentNode;
			backgroundColor =
				getComputedStyle( backgroundColorNode ).backgroundColor;
		}

		setDetectedBackgroundColor( backgroundColor );
	} );

	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	return (
		<InspectorControls group="color">
			<ColorGradientSettingsDropdown
				enableAlpha={ enableAlpha }
				panelId={ clientId }
				settings={ settings }
				__experimentalIsItemGroup={ false }
				__experimentalIsRenderedInSidebar
				{ ...colorGradientSettings }
			/>
			{ enableContrastChecking && (
				<ContrastChecker
					backgroundColor={ detectedBackgroundColor }
					textColor={ detectedColor }
					enableAlphaChecker={ enableAlpha }
					linkColor={ detectedLinkColor }
				/>
			) }
		</InspectorControls>
	);
}
