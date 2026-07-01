/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getBlockSupport } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import {
	DimensionsPanel as StylesDimensionsPanel,
	useHasDimensionsPanel,
} from '../components/global-styles';
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

export const DIMENSIONS_SUPPORT_KEY = 'dimensions';
export const SPACING_SUPPORT_KEY = 'spacing';
export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ];
export const AXIAL_SIDES = [ 'vertical', 'horizontal' ];

function useVisualizer() {
	const [ property, setProperty ] = useState( false );
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

	return [ property, setProperty ];
}

function DimensionsInspectorControl( { children, resetAllFilter } ) {
	const attributesResetAllFilter = useCallback(
		( attributes ) => {
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
			resetAllFilter={ attributesResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function DimensionsPanel( { clientId, name, setAttributes, settings } ) {
	const selectedState = useBlockStyleState();
	const isStateSelected = ! isDefaultBlockStyleState( selectedState );
	const isEnabled = useHasDimensionsPanel( settings, selectedState );
	const style = useSelect(
		( select ) => {
			// Early return to avoid subscription when disabled
			if ( ! isEnabled ) {
				return undefined;
			}
			return select( blockEditorStore ).getBlockAttributes( clientId )
				?.style;
		},
		[ clientId, isEnabled ]
	);
	const [ visualizedProperty, setVisualizedProperty ] = useVisualizer();
	const value = isStateSelected
		? getStyleForState( style, selectedState )
		: style;
	const onChange = isStateSelected
		? ( newStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
		  }
		: ( newStyle ) => {
				setAttributes( {
					style: cleanEmptyObject( newStyle ),
				} );
		  };

	if ( ! isEnabled ) {
		return null;
	}

	const defaultDimensionsControls = getBlockSupport( name, [
		DIMENSIONS_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );
	const defaultSpacingControls = getBlockSupport( name, [
		SPACING_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );
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
				value={ value }
				onChange={ onChange }
				defaultControls={ defaultControls }
				styleState={ selectedState }
				onVisualize={
					isStateSelected ? undefined : setVisualizedProperty
				}
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
 * @param {string} blockName Block name.
 * @param {string} feature   Background image feature to check for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasDimensionsSupport( blockName, feature = 'any' ) {
	const support = getBlockSupport( blockName, DIMENSIONS_SUPPORT_KEY );

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

export function isExplicitAspectRatio( aspectRatio ) {
	if ( ! aspectRatio ) {
		return false;
	}

	return `${ aspectRatio }`.trim().toLowerCase() !== 'auto';
}

export default {
	useBlockProps,
	attributeKeys: [ 'height', 'minHeight', 'width', 'style' ],
	hasSupport( name ) {
		return hasDimensionsSupport( name );
	},
};

function useBlockProps( { name, height, minHeight, style } ) {
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
	const inlineStyleOverrides = {};

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
