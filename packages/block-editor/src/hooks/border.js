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
import { BorderColorEdit, useIsBorderColorDisabled } from './border-color';
import { BorderRadiusEdit, useIsBorderRadiusDisabled } from './border-radius';
import { BorderStyleEdit, useIsBorderStyleDisabled } from './border-style';
import { BorderWidthEdit, useIsBorderWidthDisabled } from './border-width';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';

export function BorderPanel( props ) {
	const isDisabled = useIsBorderDisabled( props );
	const isSupported = hasBorderSupport( props.name );

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Border settings' ) } initialOpen={ false }>
				<BorderStyleEdit { ...props } />
				<BorderWidthEdit { ...props } />
				<BorderRadiusEdit { ...props } />
				<BorderColorEdit { ...props } />
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Determine whether there is block support for border properties.
 *
 * @param {string} blockName Block name.
 * @return {boolean}         Whether there is support.
 */
export function hasBorderSupport( blockName ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, BORDER_SUPPORT_KEY );

	return !! (
		true === support ||
		support?.color ||
		support?.radius ||
		support?.width ||
		support?.style
	);
}

/**
 * Determines whether there is any block support for borders e.g. border radius,
 * style, width etc.
 *
 * @param  {Object} props Block properties.
 * @return {boolean}      If border support is completely disabled.
 */
const useIsBorderDisabled = ( props = {} ) => {
	const configs = [
		useIsBorderColorDisabled( props ),
		useIsBorderRadiusDisabled( props ),
		useIsBorderStyleDisabled( props ),
		useIsBorderWidthDisabled( props ),
	];

	return configs.every( Boolean );
};
