/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalGrid as Grid,
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

const useHasBorderFeatureSupport = ( blockName, feature ) => {
	return (
		useSetting( `border.${ feature }` ) &&
		hasBorderSupport( blockName, feature )
	);
};

export function BorderPanel( props ) {
	const { clientId, name: blockName } = props;
	const isDisabled = useIsBorderDisabled( props );
	const isSupported = hasBorderSupport( blockName );

	const isColorSupported = useHasBorderFeatureSupport( blockName, 'color' );
	const isRadiusSupported = useHasBorderFeatureSupport( blockName, 'radius' );
	const isStyleSupported = useHasBorderFeatureSupport( blockName, 'style' );
	const isWidthSupported =
		useHasBorderFeatureSupport( blockName, 'width' ) || isStyleSupported;

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	const defaultBorderControls = getBlockSupport( props.name, [
		BORDER_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	const createResetAllFilter = (
		borderAttribute,
		topLevelAttributes = {}
	) => ( newAttributes ) => ( {
		...newAttributes,
		...topLevelAttributes,
		style: {
			...newAttributes.style,
			border: {
				...newAttributes.style?.border,
				[ borderAttribute ]: undefined,
			},
		},
	} );

	const getWidthAndStyleFilter = () => {
		if ( isWidthSupported && isStyleSupported ) {
			return ( newAttributes ) => ( {
				...newAttributes,
				style: {
					...newAttributes.style,
					border: {
						...newAttributes.style?.border,
						width: undefined,
						style: undefined,
					},
				},
			} );
		}

		return isWidthSupported
			? createResetAllFilter( 'width' )
			: createResetAllFilter( 'style' );
	};

	const hasWidthAndStyleValue = () => {
		if ( isStyleSupported ) {
			return hasBorderWidthValue( props ) || hasBorderStyleValue( props );
		}

		return hasBorderWidthValue( props );
	};

	const isWidthAndStyleDefault =
		defaultBorderControls?.widthAndStyle ||
		( isWidthSupported && defaultBorderControls?.width ) ||
		( isStyleSupported && defaultBorderControls?.style );

	const widthAndStyleLabel = ! isStyleSupported
		? __( 'Width' )
		: __( 'Width & Style' );

	const createResetWidthAndStyle = () => () => {
		if ( isWidthSupported && isStyleSupported ) {
			return resetBorderWidthAndStyle( props );
		}

		return isWidthSupported
			? resetBorderWidth( props )
			: resetBorderStyle( props );
	};

	return (
		<InspectorControls __experimentalGroup="border">
			{ isWidthSupported && ( // Style cannot be supported without width.
				<ToolsPanelItem
					hasValue={ () => hasWidthAndStyleValue() }
					label={ widthAndStyleLabel }
					onDeselect={ createResetWidthAndStyle() }
					isShownByDefault={ isWidthAndStyleDefault }
					resetAllFilter={ getWidthAndStyleFilter() }
					panelId={ clientId }
				>
					<Grid gap="4">
						<BorderWidthEdit { ...props } />
						{ isStyleSupported && <BorderStyleEdit { ...props } /> }
					</Grid>
				</ToolsPanelItem>
			) }
			{ isColorSupported && (
				<ToolsPanelItem
					hasValue={ () => hasBorderColorValue( props ) }
					label={ __( 'Color' ) }
					onDeselect={ () => resetBorderColor( props ) }
					isShownByDefault={ defaultBorderControls?.color }
					resetAllFilter={ createResetAllFilter( 'color', {
						borderColor: undefined,
					} ) }
					panelId={ clientId }
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
					resetAllFilter={ createResetAllFilter( 'radius' ) }
					panelId={ clientId }
				>
					<BorderRadiusEdit { ...props } />
				</ToolsPanelItem>
			) }
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

/**
 * Resets both the border width and style block support attributes
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetBorderWidthAndStyle( { attributes = {}, setAttributes } ) {
	const { style } = attributes;
	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			border: {
				...style?.border,
				width: undefined,
				style: undefined,
			},
		} ),
	} );
}
