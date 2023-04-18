/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
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

export function DimensionsPanel( props ) {
	const {
		clientId,
		name,
		attributes,
		setAttributes,
		__unstableParentLayout,
	} = props;
	const settings = useBlockSettings( name, __unstableParentLayout );
	const isEnabled = useHasDimensionsPanel( settings );
	const value = attributes.style;
	const [ visualizedProperty, setVisualizedProperty ] = useVisualizer();
	const onChange = ( newStyle ) => {
		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	if ( ! isEnabled ) {
		return null;
	}

	const defaultDimensionsControls = getBlockSupport( props.name, [
		DIMENSIONS_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );
	const defaultSpacingControls = getBlockSupport( props.name, [
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
					{ ...props }
				/>
			) }
			{ !! settings?.spacing?.margin && (
				<MarginVisualizer
					forceShow={ visualizedProperty === 'margin' }
					{ ...props }
				/>
			) }
		</>
	);
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

/**
 * Custom hook to determine whether the sides configured in the
 * block support are valid. A dimension property cannot declare
 * support for a mix of axial and individual sides.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   The feature custom sides relate to e.g. padding or margins.
 *
 * @return {boolean} If the feature has a valid configuration of sides.
 */
export function useIsDimensionsSupportValid( blockName, feature ) {
	const sides = useCustomSides( blockName, feature );

	if (
		sides &&
		sides.some( ( side ) => ALL_SIDES.includes( side ) ) &&
		sides.some( ( side ) => AXIAL_SIDES.includes( side ) )
	) {
		// eslint-disable-next-line no-console
		console.warn(
			`The ${ feature } support for the "${ blockName }" block can not be configured to support both axial and arbitrary sides.`
		);
		return false;
	}

	if (
		sides?.length &&
		feature === 'blockGap' &&
		! AXIAL_SIDES.every( ( side ) => sides.includes( side ) )
	) {
		// eslint-disable-next-line no-console
		console.warn(
			`The ${ feature } support for the "${ blockName }" block can not be configured to support arbitrary sides.`
		);
		return false;
	}

	return true;
}
