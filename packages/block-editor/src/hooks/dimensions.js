/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Platform, useState, useEffect, useCallback } from '@wordpress/element';
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
import { MarginVisualizer } from './margin';
import { PaddingVisualizer } from './padding';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { cleanEmptyObject, shouldSkipSerialization } from './utils';

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
	const isEnabled = useHasDimensionsPanel( settings );
	const value = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.style,
		[ clientId ]
	);
	const [ visualizedProperty, setVisualizedProperty ] = useVisualizer();
	const onChange = ( newStyle ) => {
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
				onVisualize={ setVisualizedProperty }
			/>
			{ !! settings?.spacing?.padding && (
				<PaddingVisualizer
					forceShow={ visualizedProperty === 'padding' }
					clientId={ clientId }
					value={ value }
				/>
			) }
			{ !! settings?.spacing?.margin && (
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
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, DIMENSIONS_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return !! ( support?.aspectRatio || !! support?.minHeight );
	}

	return !! support?.[ feature ];
}

export default {
	useBlockProps,
	attributeKeys: [ 'minHeight', 'style' ],
	hasSupport( name ) {
		return hasDimensionsSupport( name, 'aspectRatio' );
	},
};

function useBlockProps( { name, minHeight, style } ) {
	if (
		! hasDimensionsSupport( name, 'aspectRatio' ) ||
		shouldSkipSerialization( name, DIMENSIONS_SUPPORT_KEY, 'aspectRatio' )
	) {
		return {};
	}

	const className = classnames( {
		'has-aspect-ratio': !! style?.dimensions?.aspectRatio,
	} );

	// Allow dimensions-based inline style overrides to override any global styles rules that
	// might be set for the block, and therefore affect the display of the aspect ratio.
	const inlineStyleOverrides = {};

	// Apply rules to unset incompatible styles.
	// Note that a set `aspectRatio` will win out if both an aspect ratio and a minHeight are set.
	// This is because the aspect ratio is a newer block support, so (in theory) any aspect ratio
	// that is set should be intentional and should override any existing minHeight. The Cover block
	// and dimensions controls have logic that will manually clear the aspect ratio if a minHeight
	// is set.
	if ( style?.dimensions?.aspectRatio ) {
		// To ensure the aspect ratio does not get overridden by `minHeight` unset any existing rule.
		inlineStyleOverrides.minHeight = 'unset';
	} else if ( minHeight || style?.dimensions?.minHeight ) {
		// To ensure the minHeight does not get overridden by `aspectRatio` unset any existing rule.
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
