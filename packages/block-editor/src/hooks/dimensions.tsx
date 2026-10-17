import clsx from 'clsx';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';
import InspectorControls from '../components/inspector-controls';
import {
	DimensionsPanel as StylesDimensionsPanel,
	useHasDimensionsPanel,
} from '../components/global-styles';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { MarginVisualizer, PaddingVisualizer } from './spacing-visualizer';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { cleanEmptyObject, shouldSkipSerialization } from './utils';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import { isAxialBlockGapAllowed } from './gap';
import type { PanelStyle } from '../components/global-styles/types';
import type { Layout } from '../layouts/types';
import type {
	DimensionsAttributes,
	DimensionsHookPanelProps,
	ResetAllFilter,
	StyleInspectorControlProps,
} from './types';

export const DIMENSIONS_SUPPORT_KEY = 'dimensions';
export const SPACING_SUPPORT_KEY = 'spacing';
export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ];
export const AXIAL_SIDES = [ 'vertical', 'horizontal' ];

function useVisualizer() {
	const [ property, setProperty ] = useState< string | false >( false );
	const { hideBlockInterface, showBlockInterface } = unlock(
		useDispatch( blockEditorStore )
	);
	useEffect( () => {
		if ( ! property ) {
			showBlockInterface();
		} else {
			hideBlockInterface();
		}
	}, [ property, showBlockInterface, hideBlockInterface ] );

	return [ property, setProperty ] as const;
}

function DimensionsInspectorControl( {
	children,
	resetAllFilter,
}: StyleInspectorControlProps ) {
	const attributesResetAllFilter = useCallback(
		( attributes: DimensionsAttributes ) => {
			const existingStyle = attributes.style;
			const updatedStyle = resetAllFilter( existingStyle );
			return {
				...attributes,
				style: updatedStyle,
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="dimensions"
			// The filter reads the style attribute.
			resetAllFilter={ attributesResetAllFilter as ResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function DimensionsPanel( {
	clientId,
	name,
	setAttributes,
	settings,
}: DimensionsHookPanelProps ) {
	const selectedState = useBlockStyleState();
	const isStateSelected = ! isDefaultBlockStyleState( selectedState );
	const isEnabled = useHasDimensionsPanel( settings, selectedState );
	const { style, className, layout }: DimensionsAttributes = useSelect(
		( select ) => {
			// Early return to avoid subscription when disabled
			if ( ! isEnabled ) {
				return {};
			}
			const attributes = ( select( blockEditorStore ).getBlockAttributes(
				clientId
				// The block's attributes hold its styles and layout.
			) || {} ) as DimensionsAttributes;
			return {
				style: attributes.style,
				className: attributes.className,
				layout: attributes.layout,
			};
		},
		[ clientId, isEnabled ]
	);

	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	const [ visualizedProperty, setVisualizedProperty ] = useVisualizer();
	const value = isStateSelected
		? // The state styles have the shape of the block styles.
			( getStyleForState( style, selectedState ) as
				PanelStyle | undefined )
		: style;
	const onChange = isStateSelected
		? ( newStyle: PanelStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
			}
		: ( newStyle: PanelStyle ) => {
				setAttributes( {
					style: cleanEmptyObject( newStyle ),
				} );
			};

	if ( ! isEnabled ) {
		return null;
	}

	// The default controls map control names to whether they show.
	const defaultDimensionsControls = getBlockSupport( name, [
		DIMENSIONS_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;
	const defaultSpacingControls = getBlockSupport( name, [
		SPACING_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;
	const { default: defaultLayout } =
		// The layout support may set a default layout.
		( getBlockSupport( name, 'layout' ) as
			{ default?: Layout } | undefined ) || {};
	const defaultControls = {
		// In the block inspector, minHeight and minWidth should not
		// be shown by default unless the block explicitly opts in.
		minHeight: false,
		minWidth: false,
		...defaultDimensionsControls,
		...defaultSpacingControls,
	};

	return (
		<>
			<StylesDimensionsPanel
				as={ DimensionsInspectorControl }
				panelId={ clientId }
				settings={ settings }
				allowAxialBlockGap={ isAxialBlockGapAllowed(
					layout,
					defaultLayout
				) }
				value={ value }
				onChange={ onChange }
				defaultControls={ defaultControls }
				styleState={ selectedState }
				onVisualize={
					isStateSelected ? undefined : setVisualizedProperty
				}
				inheritedValue={ inheritedValue }
			/>
			{ ! isStateSelected &&
				!! settings?.spacing?.padding &&
				visualizedProperty === 'padding' && (
					<PaddingVisualizer
						forceShow={ visualizedProperty === 'padding' }
						clientId={ clientId }
						value={ value }
					/>
				) }
			{ ! isStateSelected &&
				!! settings?.spacing?.margin &&
				visualizedProperty === 'margin' && (
					<MarginVisualizer
						forceShow={ visualizedProperty === 'margin' }
						clientId={ clientId }
						value={ value }
					/>
				) }
		</>
	);
}

/**
 * Determine whether there is block support for dimensions.
 *
 * @param blockName Block name.
 * @param feature   Background image feature to check for.
 *
 * @return Whether there is support.
 */
export function hasDimensionsSupport(
	blockName: string | BlockType,
	feature: string = 'any'
): boolean {
	// The support is `true` or flags each dimension.
	const support = getBlockSupport( blockName, DIMENSIONS_SUPPORT_KEY ) as
		true | Record< string, unknown > | undefined;

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return !! (
			support?.aspectRatio ||
			!! support?.height ||
			!! support?.minHeight ||
			!! support?.width ||
			!! support?.minWidth
		);
	}

	return !! support?.[ feature ];
}

export function isExplicitAspectRatio( aspectRatio: unknown ) {
	if ( ! aspectRatio ) {
		return false;
	}

	return `${ aspectRatio }`.trim().toLowerCase() !== 'auto';
}

export default {
	useBlockProps,
	attributeKeys: [ 'height', 'minHeight', 'width', 'style' ],
	hasSupport( name: string | BlockType ) {
		return hasDimensionsSupport( name );
	},
};

function useBlockProps( {
	name,
	height,
	minHeight,
	style,
}: {
	name: string;
	height?: string;
	minHeight?: string;
	style?: PanelStyle;
} ) {
	if (
		! hasDimensionsSupport( name, 'aspectRatio' ) ||
		shouldSkipSerialization( name, DIMENSIONS_SUPPORT_KEY, 'aspectRatio' )
	) {
		return {};
	}

	const hasExplicitAspectRatio = isExplicitAspectRatio(
		style?.dimensions?.aspectRatio
	);
	const className = clsx( {
		'has-aspect-ratio': hasExplicitAspectRatio,
	} );

	// Allow dimensions-based inline style overrides to override any global styles rules that
	// might be set for the block, and therefore affect the display of the aspect ratio.
	const inlineStyleOverrides: {
		minHeight?: string;
		height?: string;
		aspectRatio?: string;
	} = {};

	// Apply rules to unset incompatible styles.
	// Note that an explicit `aspectRatio` will win out if both an aspect ratio and height-related properties are set.
	// This is because the aspect ratio is a newer block support, so (in theory) any aspect ratio
	// that is set should be intentional and should override any existing height properties. The Cover block
	// and dimensions controls have logic that will manually clear the aspect ratio if height properties
	// are set.
	if ( hasExplicitAspectRatio ) {
		// To ensure the aspect ratio does not get overridden by `minHeight` or `height` unset any existing rule.
		inlineStyleOverrides.minHeight = 'unset';
		inlineStyleOverrides.height = 'unset';
	} else if (
		minHeight ||
		style?.dimensions?.minHeight ||
		height ||
		style?.dimensions?.height
	) {
		// To ensure height properties do not get overridden by `aspectRatio` unset any existing rule.
		inlineStyleOverrides.aspectRatio = 'unset';
	}

	return { className, style: inlineStyleOverrides };
}

/**
 * @deprecated
 */
export function useCustomSides() {
	deprecated( 'wp.blockEditor.__experimentalUseCustomSides', {
		since: '6.3',
		version: '6.4',
	} );
}
