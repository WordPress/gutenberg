/**
 * WordPress dependencies
 */
import { __experimentalBlockSupportPanel as BlockSupportPanel } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import {
	HeightEdit,
	hasHeightSupport,
	hasHeightValue,
	resetHeight,
	useIsHeightDisabled,
} from './height';
import {
	MarginEdit,
	hasMarginSupport,
	hasMarginValue,
	resetMargin,
	useIsMarginDisabled,
} from './margin';
import {
	PaddingEdit,
	hasPaddingSupport,
	hasPaddingValue,
	resetPadding,
	useIsPaddingDisabled,
} from './padding';
import {
	WidthEdit,
	hasWidthSupport,
	hasWidthValue,
	resetWidth,
	useIsWidthDisabled,
} from './width';

export const DIMENSIONS_SUPPORT_KEY = '__experimentalDimensions';
export const SPACING_SUPPORT_KEY = 'spacing';

/**
 * Inspector controls for dimensions support.
 *
 * @param  {Object} props Block props.
 * @return {WPElement}    Inspector controls for dimensions support features.
 */
export function DimensionsPanel( props ) {
	const isPaddingDisabled = useIsPaddingDisabled( props );
	const isMarginDisabled = useIsMarginDisabled( props );
	const isHeightDisabled = useIsHeightDisabled( props );
	const isWidthDisabled = useIsWidthDisabled( props );
	const isDisabled = useIsDimensionsDisabled( props );
	const isSupported = hasDimensionsSupport( props.name );

	if ( isDisabled || ! isSupported ) {
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

	// Callback to reset all block support attributes controlled via this panel.
	const resetAll = () => {
		const { style } = props.attributes;

		props.setAttributes( {
			style: {
				...style,
				dimensions: {
					...style?.dimensions,
					height: undefined,
					width: undefined,
				},
				spacing: {
					...style?.spacing,
					margin: undefined,
					padding: undefined,
				},
			},
		} );
	};

	return (
		<InspectorControls key="dimensions">
			<BlockSupportPanel
				label={ __( 'Dimensions options' ) }
				title={ __( 'Dimensions' ) }
				resetAll={ resetAll }
			>
				{ ! isHeightDisabled && (
					<HeightEdit
						{ ...props }
						hasValue={ hasHeightValue }
						label={ __( 'Height' ) }
						reset={ resetHeight }
						isShownByDefault={ defaultDimensionsControls?.height }
					/>
				) }
				{ ! isWidthDisabled && (
					<WidthEdit
						{ ...props }
						hasValue={ hasWidthValue }
						label={ __( 'Width' ) }
						reset={ resetWidth }
						isShownByDefault={ defaultDimensionsControls?.width }
					/>
				) }
				{ ! isPaddingDisabled && (
					<PaddingEdit
						{ ...props }
						hasValue={ hasPaddingValue }
						label={ __( 'Padding' ) }
						reset={ resetPadding }
						isShownByDefault={ defaultSpacingControls?.padding }
					/>
				) }
				{ ! isMarginDisabled && (
					<MarginEdit
						{ ...props }
						hasValue={ hasMarginValue }
						label={ __( 'Margin' ) }
						reset={ resetMargin }
						isShownByDefault={ defaultSpacingControls?.margin }
					/>
				) }
			</BlockSupportPanel>
		</InspectorControls>
	);
}

/**
 * Determine whether there is dimensions related block support.
 *
 * @param {string} blockName Block name.
 * @return {boolean}         Whether there is support.
 */
export function hasDimensionsSupport( blockName ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	return (
		hasHeightSupport( blockName ) ||
		hasWidthSupport( blockName ) ||
		hasPaddingSupport( blockName ) ||
		hasMarginSupport( blockName )
	);
}

/**
 * Determines whether dimensions support has been disabled.
 *
 * @param  {Object} props Block properties.
 * @return {boolean}      If dimensions support is completely disabled.
 */
const useIsDimensionsDisabled = ( props = {} ) => {
	const heightDisabled = useIsHeightDisabled( props );
	const widthDisabled = useIsWidthDisabled( props );
	const paddingDisabled = useIsPaddingDisabled( props );
	const marginDisabled = useIsMarginDisabled( props );

	return heightDisabled && widthDisabled && paddingDisabled && marginDisabled;
};

/**
 * Custom hook to retrieve which padding/margin is supported
 * e.g. top, right, bottom or left.
 *
 * Sides are opted into by default. It is only if a specific side is set to
 * false that it is omitted.
 *
 * @param  {string} blockName Block name.
 * @param  {string} feature   The feature custom sides relate to e.g. padding or margins.
 * @return {Object}           Sides supporting custom margin.
 */
export function useCustomSides( blockName, feature ) {
	const support = getBlockSupport( blockName, SPACING_SUPPORT_KEY );

	// Skip when setting is boolean as theme isn't setting arbitrary sides.
	if ( typeof support[ feature ] === 'boolean' ) {
		return;
	}

	return support[ feature ];
}
