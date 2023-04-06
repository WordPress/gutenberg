/**
 * WordPress dependencies
 */
import {
	__experimentalBorderBoxControl as BorderBoxControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalIsDefinedBorder as isDefinedBorder,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BorderRadiusControl from '../border-radius-control';
import { useColorsPerOrigin } from './hooks';
import { getValueFromVariable } from './utils';

export function useHasBorderPanel( settings ) {
	const controls = [
		useHasBorderColorControl( settings ),
		useHasBorderRadiusControl( settings ),
		useHasBorderStyleControl( settings ),
		useHasBorderWidthControl( settings ),
	];

	return controls.some( Boolean );
}

function useHasBorderColorControl( settings ) {
	return settings?.border?.color;
}

function useHasBorderRadiusControl( settings ) {
	return settings?.border?.radius;
}

function useHasBorderStyleControl( settings ) {
	return settings?.border?.style;
}

function useHasBorderWidthControl( settings ) {
	return settings?.border?.width;
}

function applyFallbackStyle( border ) {
	if ( ! border ) {
		return border;
	}

	if ( ! border.style && ( border.color || border.width ) ) {
		return { ...border, style: 'solid' };
	}

	return border;
}

function applyAllFallbackStyles( border ) {
	if ( ! border ) {
		return border;
	}

	if ( hasSplitBorders( border ) ) {
		return {
			top: applyFallbackStyle( border.top ),
			right: applyFallbackStyle( border.right ),
			bottom: applyFallbackStyle( border.bottom ),
			left: applyFallbackStyle( border.left ),
		};
	}

	return applyFallbackStyle( border );
}

function BorderToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Border' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	radius: true,
	color: true,
	width: true,
};

export default function BorderPanel( {
	as: Wrapper = BorderToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const colors = useColorsPerOrigin( settings );
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const encodeColorValue = ( colorValue ) => {
		const allColors = colors.flatMap(
			( { colors: originColors } ) => originColors
		);
		const colorObject = allColors.find(
			( { color } ) => color === colorValue
		);
		return colorObject
			? 'var:preset|color|' + colorObject.slug
			: colorValue;
	};
	const decodeColorValue = useCallback(
		( colorValue ) => {
			const allColors = colors.flatMap(
				( { colors: originColors } ) => originColors
			);
			const colorObject = allColors.find(
				( { slug } ) => colorValue === 'var:preset|color|' + slug
			);
			return colorObject ? colorObject.color : colorValue;
		},
		[ colors ]
	);
	const border = useMemo( () => {
		if ( hasSplitBorders( inheritedValue?.border ) ) {
			const borderValue = { ...inheritedValue?.border };
			[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
				borderValue[ side ] = {
					...borderValue[ side ],
					color: decodeColorValue( borderValue[ side ]?.color ),
				};
			} );
			return borderValue;
		}
		return {
			...inheritedValue?.border,
			color: inheritedValue?.border?.color
				? decodeColorValue( inheritedValue?.border?.color )
				: undefined,
		};
	}, [ inheritedValue?.border, decodeColorValue ] );
	const setBorder = ( newBorder ) =>
		onChange( { ...value, border: newBorder } );
	const showBorderColor = useHasBorderColorControl( settings );
	const showBorderStyle = useHasBorderStyleControl( settings );
	const showBorderWidth = useHasBorderWidthControl( settings );

	// Border radius.
	const showBorderRadius = useHasBorderRadiusControl( settings );
	const borderRadiusValues = decodeValue( border?.radius );
	const setBorderRadius = ( newBorderRadius ) =>
		setBorder( { ...border, radius: newBorderRadius } );
	const hasBorderRadius = () => {
		const borderValues = value?.border?.radius;
		if ( typeof borderValues === 'object' ) {
			return Object.entries( borderValues ).some( Boolean );
		}
		return !! borderValues;
	};

	const resetBorder = () => {
		if ( hasBorderRadius() ) {
			return setBorder( { radius: value?.border?.radius } );
		}

		setBorder( undefined );
	};

	const onBorderChange = ( newBorder ) => {
		// Ensure we have a visible border style when a border width or
		// color is being selected.
		const updatedBorder = applyAllFallbackStyles( newBorder );

		if ( hasSplitBorders( updatedBorder ) ) {
			[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
				if ( updatedBorder[ side ] ) {
					updatedBorder[ side ] = {
						...updatedBorder[ side ],
						color: encodeColorValue( updatedBorder[ side ]?.color ),
					};
				}
			} );
		} else if ( updatedBorder ) {
			updatedBorder.color = encodeColorValue( updatedBorder.color );
		}

		// As radius is maintained separately to color, style, and width
		// maintain its value. Undefined values here will be cleaned when
		// global styles are saved.
		setBorder( { radius: border?.radius, ...updatedBorder } );
	};

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			border: undefined,
		};
	}, [] );

	const showBorderByDefault =
		defaultControls?.color || defaultControls?.width;

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ ( showBorderWidth || showBorderColor ) && (
				<ToolsPanelItem
					hasValue={ () => isDefinedBorder( value?.border ) }
					label={ __( 'Border' ) }
					onDeselect={ () => resetBorder() }
					isShownByDefault={ showBorderByDefault }
					panelId={ panelId }
				>
					<BorderBoxControl
						colors={ colors }
						enableAlpha={ true }
						enableStyle={ showBorderStyle }
						onChange={ onBorderChange }
						popoverOffset={ 40 }
						popoverPlacement="left-start"
						value={ border }
						__experimentalIsRenderedInSidebar={ true }
						size={ '__unstable-large' }
					/>
				</ToolsPanelItem>
			) }
			{ showBorderRadius && (
				<ToolsPanelItem
					hasValue={ hasBorderRadius }
					label={ __( 'Radius' ) }
					onDeselect={ () => setBorderRadius( undefined ) }
					isShownByDefault={ defaultControls.radius }
					panelId={ panelId }
				>
					<BorderRadiusControl
						values={ borderRadiusValues }
						onChange={ ( newValue ) => {
							setBorderRadius( newValue || undefined );
						} }
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
