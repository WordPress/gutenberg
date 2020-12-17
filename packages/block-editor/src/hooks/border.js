/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { BorderRadiusEdit, useIsBorderRadiusDisabled } from './border-radius';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';

export function BorderPanel( props ) {
	const isDisabled = useIsBorderDisabled( props );
	const isSupported = hasBorderSupport( props.name );

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Border settings' ) }>
				<BorderRadiusEdit { ...props } />
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Determine whether there is block support for borders.
 *
 * @param {string} blockName Block name.
 * @return {boolean}         Whether there is support.
 */
export function hasBorderSupport( blockName ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, BORDER_SUPPORT_KEY );

	// Further border properties to be added in future iterations.
	// e.g. support && ( support.radius || support.width || support.style )
	return true === support || ( support && support.radius );
}

/**
 * Determines whether there is any block support for borders e.g. border radius,
 * style, width etc.
 *
 * @param  {Object} props Block properties.
 * @return {boolean}      If border support is completely disabled.
 */
const useIsBorderDisabled = ( props = {} ) => {
	// Further border properties to be added in future iterations.
	// e.g. const configs = [
	// 		useIsBorderRadiusDisabled( props ),
	//		useIsBorderWidthDisabled( props ),
	// ];
	const configs = [ useIsBorderRadiusDisabled( props ) ];
	return configs.filter( Boolean ).length === configs.length;
};
