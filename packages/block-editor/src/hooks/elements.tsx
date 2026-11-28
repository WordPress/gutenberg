import { getBlockSupport } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import InspectorControls from '../components/inspector-controls';
import {
	useHasColorPanel,
	default as StylesColorPanel,
} from '../components/global-styles/color-panel';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
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
import type { PanelStyle } from '../components/global-styles/types';
import type {
	ElementsAttributes,
	ElementsEditProps,
	ResetAllFilter,
	StyleInspectorControlProps,
} from './types';

function ElementsInspectorControl( {
	children,
	resetAllFilter,
}: StyleInspectorControlProps ) {
	const attributesResetAllFilter = useCallback(
		( attributes: ElementsAttributes ) => {
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
			// The filter reads the style attribute.
			resetAllFilter={ attributesResetAllFilter as ResetAllFilter }
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
}: ElementsEditProps ) {
	const selectedState = useBlockStyleState();
	const isEnabled = useHasColorPanel( settings );

	const { style, className }: ElementsAttributes = useSelect(
		( select ) => {
			if ( ! isEnabled ) {
				return {};
			}
			// The block's attributes hold its element styles.
			const attributes = select( blockEditorStore ).getBlockAttributes(
				clientId
			) as ElementsAttributes | null;
			return {
				style: attributes?.style,
				className: attributes?.className,
			};
		},
		[ clientId, isEnabled ]
	);

	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	const isStateSelected = ! isDefaultBlockStyleState( selectedState );

	const value = useMemo( () => {
		if ( isStateSelected ) {
			// The state styles have the shape of the block styles.
			return getStyleForState( style, selectedState ) as
				PanelStyle | undefined;
		}
		return style;
	}, [ isStateSelected, selectedState, style ] );

	const onChange = isStateSelected
		? ( newStyle: PanelStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
			}
		: ( newStyle: PanelStyle ) => {
				setAttributes( { style: cleanEmptyObject( newStyle ) } );
			};

	// Text and background color failures are reported by the Typography and
	// Background panels, which own those selections.
	const enableContrastChecking =
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
		: // The default controls map control names to whether they show.
			( getBlockSupport( name, [
				COLOR_SUPPORT_KEY,
				'__experimentalDefaultControls',
			] ) as Record< string, boolean > | undefined );

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
			inheritedValue={ inheritedValue }
		/>
	);
}
