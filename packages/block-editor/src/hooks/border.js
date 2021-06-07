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
import useSetting from '../components/use-setting';
import { BorderColorEdit } from './border-color';
import { BorderRadiusEdit } from './border-radius';
import { BorderStyleEdit } from './border-style';
import { BorderWidthEdit } from './border-width';

const isWeb = Platform.OS === 'web';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';
export const CSS_UNITS = [
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
		a11yLabel: __( 'Pixels (px)' ),
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
		a11yLabel: __( 'Relative to parent font size (em)' ),
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
		a11yLabel: __( 'Relative to root font size (rem)' ),
	},
];

/**
 * Parses a CSS unit from a border CSS value.
 *
 * @param  {string} cssValue CSS value to parse e.g. `10px` or `1.5em`.
 * @return {string}          CSS unit from provided value or default 'px'.
 */
export function parseUnit( cssValue ) {
	const value = String( cssValue ).trim();
	const unitMatch = value.match( /[\d.\-\+]*\s*(.*)/ )[ 1 ];
	const unit = unitMatch !== undefined ? unitMatch.toLowerCase() : '';
	const currentUnit = CSS_UNITS.find( ( item ) => item.value === unit );

	return currentUnit?.value || 'px';
}

export function BorderPanel( props ) {
	const isDisabled = useIsBorderDisabled( props );
	const isSupported = hasBorderSupport( props.name );

	const isColorSupported =
		useSetting( 'border.customColor' ) &&
		hasBorderSupport( props.name, 'color' );

	const isRadiusSupported =
		useSetting( 'border.customRadius' ) &&
		hasBorderSupport( props.name, 'radius' );

	const isStyleSupported =
		useSetting( 'border.customStyle' ) &&
		hasBorderSupport( props.name, 'style' );

	const isWidthSupported =
		useSetting( 'border.customWidth' ) &&
		hasBorderSupport( props.name, 'width' );

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody
				className="block-editor-hooks__border-controls"
				title={ __( 'Border settings' ) }
				initialOpen={ false }
			>
				{ isStyleSupported && <BorderStyleEdit { ...props } /> }
				{ isWidthSupported && <BorderWidthEdit { ...props } /> }
				{ isRadiusSupported && <BorderRadiusEdit { ...props } /> }
				{ isColorSupported && <BorderColorEdit { ...props } /> }
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Determine whether there is block support for border properties.
 *
 * @param  {string} blockName Block name.
 * @param  {string} feature   Border feature to check support for.
 * @return {boolean}          Whether there is support.
 */
export function hasBorderSupport( blockName, feature = 'any' ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, BORDER_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return !! (
			support?.color ||
			support?.radius ||
			support?.width ||
			support?.style
		);
	}

	return !! support?.[ feature ];
}

/**
 * Check whether serialization of border classes and styles should be skipped.
 *
 * @param  {string|Object} blockType Block name or block type object.
 * @return {boolean}                 Whether serialization of border properties should occur.
 */
export function shouldSkipSerialization( blockType ) {
	const support = getBlockSupport( blockType, BORDER_SUPPORT_KEY );

	return support?.__experimentalSkipSerialization;
}

/**
 * Determines if all border support features have been disabled.
 *
 * @return {boolean} If border support is completely disabled.
 */
const useIsBorderDisabled = () => {
	const configs = [
		! useSetting( 'border.customColor' ),
		! useSetting( 'border.customRadius' ),
		! useSetting( 'border.customStyle' ),
		! useSetting( 'border.customWidth' ),
	];

	return configs.every( Boolean );
};
