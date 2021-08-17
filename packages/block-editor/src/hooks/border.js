/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BorderColorEdit,
	hasBorderColorValue,
	resetBorderColor,
} from './border-color';
import {
	BorderRadiusEdit,
	hasBorderRadiusValue,
	resetBorderRadius,
} from './border-radius';
import {
	BorderStyleEdit,
	hasBorderStyleValue,
	resetBorderStyle,
} from './border-style';
import {
	BorderWidthEdit,
	hasBorderWidthValue,
	resetBorderWidth,
} from './border-width';
import InspectorControls from '../components/inspector-controls';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';

export function BorderPanel( props ) {
	const isDisabled = useIsBorderDisabled( props );
	const isSupported = hasBorderSupport( props.name );

	const isColorSupported =
		useSetting( 'border.color' ) && hasBorderSupport( props.name, 'color' );

	const isRadiusSupported =
		useSetting( 'border.radius' ) &&
		hasBorderSupport( props.name, 'radius' );

	const isStyleSupported =
		useSetting( 'border.style' ) && hasBorderSupport( props.name, 'style' );

	const isWidthSupported =
		useSetting( 'border.width' ) && hasBorderSupport( props.name, 'width' );

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	const defaultBorderControls = getBlockSupport( props.name, [
		BORDER_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	// Callback to reset all block support attributes controlled via this panel.
	const resetAll = () => {
		const { style } = props.attributes;
		const newStyle = cleanEmptyObject( {
			...style,
			border: undefined,
		} );

		props.setAttributes( { style: newStyle, borderColor: undefined } );
	};

	return (
		<InspectorControls>
			<ToolsPanel
				className="block-editor-hooks__border-controls"
				label={ __( 'Border options' ) }
				header={ __( 'Border' ) }
				resetAll={ resetAll }
			>
				{ isWidthSupported && (
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => hasBorderWidthValue( props ) }
						label={ __( 'Width' ) }
						onDeselect={ () => resetBorderWidth( props ) }
						isShownByDefault={ defaultBorderControls?.width }
					>
						<BorderWidthEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ isStyleSupported && (
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => hasBorderStyleValue( props ) }
						label={ __( 'Style' ) }
						onDeselect={ () => resetBorderStyle( props ) }
						isShownByDefault={ defaultBorderControls?.style }
					>
						<BorderStyleEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ isColorSupported && (
					<ToolsPanelItem
						hasValue={ () => hasBorderColorValue( props ) }
						label={ __( 'Color' ) }
						onDeselect={ () => resetBorderColor( props ) }
						isShownByDefault={ defaultBorderControls?.color }
					>
						<BorderColorEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ isRadiusSupported && (
					<ToolsPanelItem
						hasValue={ () => hasBorderRadiusValue( props ) }
						label={ __( 'Radius' ) }
						onDeselect={ () => resetBorderRadius( props ) }
						isShownByDefault={ defaultBorderControls?.radius }
					>
						<BorderRadiusEdit { ...props } />
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</InspectorControls>
	);
}

/**
 * Determine whether there is block support for border properties.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Border feature to check support for.
 *
 * @return {boolean} Whether there is support.
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
 * @param {string|Object} blockType Block name or block type object.
 *
 * @return {boolean} Whether serialization of border properties should occur.
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
		! useSetting( 'border.color' ),
		! useSetting( 'border.radius' ),
		! useSetting( 'border.style' ),
		! useSetting( 'border.width' ),
	];

	return configs.every( Boolean );
};

/**
 * Returns a new style object where the specified border attribute has been
 * removed.
 *
 * @param {Object} style     Styles from block attributes.
 * @param {string} attribute The border style attribute to clear.
 *
 * @return {Object} Style object with the specified attribute removed.
 */
export function removeBorderAttribute( style, attribute ) {
	return cleanEmptyObject( {
		...style,
		border: {
			...style?.border,
			[ attribute ]: undefined,
		},
	} );
}
