/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ContrastChecker from '../components/contrast-checker';
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';
import ColorGradientControl from '../components/colors-gradients/control';
import useCommonSingleMultipleSelects from '../components/colors-gradients/use-common-single-multiple-selects';
import useSetting from '../components/use-setting';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function ColorPanel( {
	setting,
	clientId,
	enableContrastChecking = true,
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const ref = useBlockRef( clientId );
	const colorGradientSettings = useCommonSingleMultipleSelects();
	colorGradientSettings.colors = useSetting( 'color.palette' );
	colorGradientSettings.gradients = useSetting( 'color.gradients' );

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
		<div className="block-editor-panel-color-gradient-settings">
			<ColorGradientControl
				showTitle={ false }
				{ ...colorGradientSettings }
				{ ...setting }
			/>
			{ enableContrastChecking && (
				<ContrastChecker
					backgroundColor={ detectedBackgroundColor }
					textColor={ detectedColor }
				/>
			) }
		</div>
	);
}
