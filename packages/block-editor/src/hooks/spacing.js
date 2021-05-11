/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { MarginEdit, hasMarginSupport, useIsMarginDisabled } from './margin';
import {
	PaddingEdit,
	hasPaddingSupport,
	useIsPaddingDisabled,
} from './padding';

export const SPACING_SUPPORT_KEY = 'spacing';

/**
 * Inspector controls for spacing support.
 *
 * @param  {Object} props Block props.
 * @return {WPElement}    Inspector controls for spacing support features.
 */
export function SpacingPanel( props ) {
	const isDisabled = useIsSpacingDisabled( props );
	const isSupported = hasSpacingSupport( props.name );

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	return (
		<InspectorControls key="spacing">
			<PanelBody title={ __( 'Spacing' ) }>
				<PaddingEdit { ...props } />
				<MarginEdit { ...props } />
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Determine whether there is block support for padding or margins.
 *
 * @param {string} blockName Block name.
 * @return {boolean}         Whether there is support.
 */
export function hasSpacingSupport( blockName ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	return hasPaddingSupport( blockName ) || hasMarginSupport( blockName );
}

/**
 * Determines whether spacing support has been disabled.
 *
 * @param  {Object} props Block properties.
 * @return {boolean}      If spacing support is completely disabled.
 */
const useIsSpacingDisabled = ( props = {} ) => {
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
