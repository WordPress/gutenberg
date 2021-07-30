/**
 * WordPress dependencies
 */
import {
	__experimentalProgressiveDisclosurePanel as ProgressiveDisclosurePanel,
	__experimentalProgressiveDisclosurePanelItem as ProgressiveDisclosurePanelItem,
} from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
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
import { cleanEmptyObject } from './utils';

export const SPACING_SUPPORT_KEY = 'spacing';

/**
 * Inspector controls for dimensions support.
 *
 * @param {Object} props Block props.
 *
 * @return {WPElement} Inspector controls for spacing support features.
 */
export function DimensionsPanel( props ) {
	const isPaddingDisabled = useIsPaddingDisabled( props );
	const isMarginDisabled = useIsMarginDisabled( props );
	const isDisabled = useIsDimensionsDisabled( props );
	const isSupported = hasDimensionsSupport( props.name );

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	const defaultSpacingControls = getBlockSupport( props.name, [
		SPACING_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	// Callback to reset all block support attributes controlled via this panel.
	const resetAll = () => {
		const { style } = props.attributes;

		props.setAttributes( {
			style: cleanEmptyObject( {
				...style,
				spacing: {
					...style?.spacing,
					margin: undefined,
					padding: undefined,
				},
			} ),
		} );
	};

	return (
		<InspectorControls key="dimensions">
			<ProgressiveDisclosurePanel
				label={ __( 'Dimensions options' ) }
				header={ __( 'Dimensions' ) }
				resetAll={ resetAll }
			>
				{ ! isPaddingDisabled && (
					<ProgressiveDisclosurePanelItem
						hasValue={ () => hasPaddingValue( props ) }
						label={ __( 'Padding' ) }
						onDeselect={ () => resetPadding( props ) }
						isShownByDefault={ defaultSpacingControls?.padding }
					>
						<PaddingEdit { ...props } />
					</ProgressiveDisclosurePanelItem>
				) }
				{ ! isMarginDisabled && (
					<ProgressiveDisclosurePanelItem
						hasValue={ () => hasMarginValue( props ) }
						label={ __( 'Margin' ) }
						onDeselect={ () => resetMargin( props ) }
						isShownByDefault={ defaultSpacingControls?.margin }
					>
						<MarginEdit { ...props } />
					</ProgressiveDisclosurePanelItem>
				) }
			</ProgressiveDisclosurePanel>
		</InspectorControls>
	);
}

/**
 * Determine whether there is dimensions related block support.
 *
 * @param {string} blockName Block name.
 *
 * @return {boolean} Whether there is support.
 */
export function hasDimensionsSupport( blockName ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	return hasPaddingSupport( blockName ) || hasMarginSupport( blockName );
}

/**
 * Determines whether dimensions support has been disabled.
 *
 * @param {Object} props Block properties.
 *
 * @return {boolean} If spacing support is completely disabled.
 */
const useIsDimensionsDisabled = ( props = {} ) => {
	const paddingDisabled = useIsPaddingDisabled( props );
	const marginDisabled = useIsMarginDisabled( props );

	return paddingDisabled && marginDisabled;
};

/**
 * Custom hook to retrieve which padding/margin is supported
 * e.g. top, right, bottom or left.
 *
 * Sides are opted into by default. It is only if a specific side is set to
 * false that it is omitted.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   The feature custom sides relate to e.g. padding or margins.
 *
 * @return {Object} Sides supporting custom margin.
 */
export function useCustomSides( blockName, feature ) {
	const support = getBlockSupport( blockName, SPACING_SUPPORT_KEY );

	// Skip when setting is boolean as theme isn't setting arbitrary sides.
	if ( typeof support[ feature ] === 'boolean' ) {
		return;
	}

	return support[ feature ];
}
