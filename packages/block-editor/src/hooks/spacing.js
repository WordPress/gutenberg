/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	PaddingEdit,
	hasPaddingSupport,
	useIsPaddingDisabled,
} from './padding';
import SpacingPanelControl from '../components/spacing-panel-control';

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
		<SpacingPanelControl key="spacing">
			<PaddingEdit { ...props } />
		</SpacingPanelControl>
	);
}

/**
 * Determine whether there is block support for padding.
 *
 * @param {string} blockName Block name.
 * @return {boolean}         Whether there is support.
 */
export function hasSpacingSupport( blockName ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	return hasPaddingSupport( blockName );
}

/**
 * Determines whether spacing support has been disabled.
 *
 * @param  {Object} props Block properties.
 * @return {boolean}      If spacing support is completely disabled.
 */
const useIsSpacingDisabled = ( props = {} ) => {
	const paddingDisabled = useIsPaddingDisabled( props );

	return paddingDisabled;
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
