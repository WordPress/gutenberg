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
	isSelected,
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
		// If contrast checking is disabled, don't do anything.
		if ( ! enableContrastChecking ) {
			return;
		}

		if ( definedColors.length === 0 ) {
			setDetectedBackgroundColor( undefined );
			setDetectedLinkColor( undefined );
			setDetectedColor( undefined );
			return;
		}

		if ( ! ref.current ) {
			return;
		}

		// Try to detect the colors for the text, link and background based on the
		// current ref.
		setDetectedColor( getComputedStyle( ref.current ).color );

		const firstLinkElement = ref.current?.querySelector( 'a' );
		if ( firstLinkElement && !! firstLinkElement.innerText ) {
			setDetectedLinkColor( getComputedStyle( firstLinkElement ).color );
		}

		let backgroundColorNode = ref.current;
		let backgroundColor =
			getComputedStyle( backgroundColorNode ).backgroundColor;

		// If the current node has a transparent background color, we need to
		// find the first parent node with a non-transparent background color.
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

		// If colors are defined, overwrite detected colors with the defined colors.
		if ( definedColors.length ) {
			definedColors.forEach( ( color ) => {
				if ( ! color.colorValue ) {
					return;
				}

				if ( 'Background' === color.label ) {
					setDetectedBackgroundColor( color.colorValue );
				}

				if ( 'Text' === color.label ) {
					setDetectedColor( color.colorValue );
				}

				if ( 'Link' === color.label ) {
					setDetectedLinkColor( color.colorValue );
				}
			} );
		}
	}, [
		enableContrastChecking,
		definedColors,
		ref,
		detectedBackgroundColor,
		detectedColor,
		enableAlpha,
		detectedLinkColor,
		clientId,
		isSelected,
	] );

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
