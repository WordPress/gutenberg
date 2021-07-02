/**
 * WordPress dependencies
 */
import { __experimentalProgressiveDisclosurePanel as ProgressiveDisclosurePanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../components/colors-gradients/control';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';
import useSetting from '../components/use-setting';
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

// Simple wrapper to allow passing non DOM attribute props that will be
// picked up an used by the progress disclosure panel
// e.g. `hasValue` or `onDeselect`
const ColorSetControlWrapper = ( { children } ) => {
	return <div className="color-set-control">{ children }</div>;
};

// Wraps a semantic group of custom color controls and their contrast checker.
// Making this a single component allows for these controls to be grouped within
// the progressive disclosure panel's dropdown menu.
const ColorSetControl = ( {
	contrastSettings,
	children,
	colorSettings,
	colors,
	disableCustomColors,
	disableCustomGradients,
	gradients,
	...props
} ) => {
	if ( ! colorSettings?.length ) {
		return null;
	}

	return (
		<ColorSetControlWrapper { ...props }>
			{ colorSettings.map( ( setting, index ) => (
				<ColorGradientControl
					key={ index }
					{ ...{
						colors,
						gradients,
						disableCustomColors,
						disableCustomGradients,
						...setting,
					} }
				/>
			) ) }
			{ contrastSettings && <ContrastChecker { ...contrastSettings } /> }
			{ children }
		</ColorSetControlWrapper>
	);
};

export default function ColorPanel( {
	resetAll,
	colorSets,
	clientId,
	enableContrastChecking = true,
	...props
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const ref = useBlockRef( clientId );

	const colors = useSetting( 'color.palette' );
	const gradients = useSetting( 'color.gradients' );
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomGradients = ! useSetting( 'color.customGradient' );

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
			<ProgressiveDisclosurePanel
				label={ __( 'Color options' ) }
				title={ __( 'Color' ) }
				resetAll={ resetAll }
			>
				{ colorSets.map( ( colorSet, index ) => (
					<ColorSetControl
						key={ index }
						{ ...{
							colors,
							gradients,
							disableCustomColors,
							disableCustomGradients,
							...colorSet,
						} }
						{ ...props }
					>
						{ colorSet.checkDefaultContrast &&
							enableContrastChecking && (
								<ContrastChecker
									backgroundColor={ detectedBackgroundColor }
									textColor={ detectedColor }
								/>
							) }
					</ColorSetControl>
				) ) }
			</ProgressiveDisclosurePanel>
		</InspectorControls>
	);
}
