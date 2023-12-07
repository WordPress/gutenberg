/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getBlockSupport } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';
import { pure } from '@wordpress/compose';

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

import { cleanEmptyObject, useBlockSettings } from './utils';

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

function DimensionsPanelPure( {
	clientId,
	name,
	setAttributes,
	__unstableParentLayout,
} ) {
	const settings = useBlockSettings( name, __unstableParentLayout );
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

// We don't want block controls to re-render when typing inside a block. `pure`
// will prevent re-renders unless props change, so only pass the needed props
// and not the whole attributes object.
export const DimensionsPanel = pure( DimensionsPanelPure );

/**
 * @deprecated
 */
export function useCustomSides() {
	deprecated( 'wp.blockEditor.__experimentalUseCustomSides', {
		since: '6.3',
		version: '6.4',
	} );
}
