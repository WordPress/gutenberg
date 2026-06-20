/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import {
	useHasColorPanel,
	default as StylesColorPanel,
} from '../components/global-styles/color-panel';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';
import { COLOR_SUPPORT_KEY } from './color';
import useBlockColorContrastWarning from './contrast-checker';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';

function ElementsInspectorControl( { children, resetAllFilter } ) {
	const attributesResetAllFilter = useCallback(
		( attributes ) => {
			const updatedStyle = resetAllFilter( attributes.style );
			return {
				...attributes,
				style: cleanEmptyObject( updatedStyle ),
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="elements"
			resetAllFilter={ attributesResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function ElementsEdit( {
	clientId,
	name,
	setAttributes,
	settings,
	asWrapper,
	label,
	defaultControls,
} ) {
	const selectedState = useBlockStyleState();
	const isEnabled = useHasColorPanel( settings );

	const style = useSelect(
		( select ) => {
			if ( ! isEnabled ) {
				return undefined;
			}
			const attributes =
				select( blockEditorStore ).getBlockAttributes( clientId );
			return attributes?.style;
		},
		[ clientId, isEnabled ]
	);

	const isStateSelected = ! isDefaultBlockStyleState( selectedState );

	const value = useMemo( () => {
		if ( isStateSelected ) {
			return getStyleForState( style, selectedState );
		}
		return style;
	}, [ isStateSelected, selectedState, style ] );

	const onChange = isStateSelected
		? ( newStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
		  }
		: ( newStyle ) => {
				setAttributes( { style: cleanEmptyObject( newStyle ) } );
		  };

	// Text and background color failures are reported by the Typography and
	// Background panels, which own those selections.
	const enableContrastChecking =
		! isStateSelected &&
		!! value?.elements?.link?.color?.text &&
		settings?.color?.link &&
		false !==
			getBlockSupport( name, [
				COLOR_SUPPORT_KEY,
				'enableContrastChecker',
			] );

	const contrastWarning = useBlockColorContrastWarning( {
		clientId,
		name,
		enabled: !! enableContrastChecking,
		checkTextColor: false,
		messageOverride: __(
			'This link color has poor contrast against the background. Consider increasing contrast.'
		),
	} );

	if ( ! isEnabled ) {
		return null;
	}

	defaultControls = defaultControls
		? defaultControls
		: getBlockSupport( name, [
				COLOR_SUPPORT_KEY,
				'__experimentalDefaultControls',
		  ] );

	const Wrapper = asWrapper || ElementsInspectorControl;

	return (
		<StylesColorPanel
			as={ Wrapper }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
			label={ label }
			contrastWarning={ contrastWarning }
		/>
	);
}
