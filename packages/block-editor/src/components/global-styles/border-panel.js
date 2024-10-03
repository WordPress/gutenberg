/**
 * WordPress dependencies
 */
import {
	BorderBoxControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalIsDefinedBorder as isDefinedBorder,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalItemGroup as ItemGroup,
	BaseControl,
} from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BorderRadiusControl from '../border-radius-control';
import { useColorsPerOrigin } from './hooks';
import { getValueFromVariable, useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import { useBorderPanelLabel } from '../../hooks/border';
import { ShadowPopover, useShadowPresets } from './shadow-panel-components';

export function useHasBorderPanel( settings ) {
	const controls = Object.values( useHasBorderPanelControls( settings ) );
	return controls.some( Boolean );
}

export function useHasBorderPanelControls( settings ) {
	const controls = {
		hasBorderColor: useHasBorderColorControl( settings ),
		hasBorderRadius: useHasBorderRadiusControl( settings ),
		hasBorderStyle: useHasBorderStyleControl( settings ),
		hasBorderWidth: useHasBorderWidthControl( settings ),
		hasShadow: useHasShadowControl( settings ),
	};

	return controls;
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

function useHasShadowControl( settings ) {
	const shadows = useShadowPresets( settings );
	return !! settings?.shadow && shadows.length > 0;
}

function BorderToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	label,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ label }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	radius: true,
	color: true,
	width: true,
	shadow: true,
};

export default function BorderPanel( {
	as: Wrapper = BorderToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	name,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const colors = useColorsPerOrigin( settings );
	const decodeValue = useCallback(
		( rawValue ) => getValueFromVariable( { settings }, '', rawValue ),
		[ settings ]
	);
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
	const border = useMemo( () => {
		if ( hasSplitBorders( inheritedValue?.border ) ) {
			const borderValue = { ...inheritedValue?.border };
			[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
				borderValue[ side ] = {
					...borderValue[ side ],
					color: decodeValue( borderValue[ side ]?.color ),
				};
			} );
			return borderValue;
		}
		return {
			...inheritedValue?.border,
			color: inheritedValue?.border?.color
				? decodeValue( inheritedValue?.border?.color )
				: undefined,
		};
	}, [ inheritedValue?.border, decodeValue ] );
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
	const hasShadowControl = useHasShadowControl( settings );

	// Shadow
	const shadow = decodeValue( inheritedValue?.shadow );
	const shadowPresets = settings?.shadow?.presets ?? {};
	const mergedShadowPresets =
		shadowPresets.custom ??
		shadowPresets.theme ??
		shadowPresets.default ??
		[];
	const setShadow = ( newValue ) => {
		const slug = mergedShadowPresets?.find(
			( { shadow: shadowName } ) => shadowName === newValue
		)?.slug;

		onChange(
			setImmutably(
				value,
				[ 'shadow' ],
				slug ? `var:preset|shadow|${ slug }` : newValue || undefined
			)
		);
	};
	const hasShadow = () => !! value?.shadow;
	const resetShadow = () => setShadow( undefined );

	const resetBorder = () => {
		if ( hasBorderRadius() ) {
			return setBorder( { radius: value?.border?.radius } );
		}

		setBorder( undefined );
	};

	const onBorderChange = ( newBorder ) => {
		// Ensure we have a visible border style when a border width or
		// color is being selected.
		const updatedBorder = { ...newBorder };

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
			shadow: undefined,
		};
	}, [] );

	const showBorderByDefault =
		defaultControls?.color || defaultControls?.width;

	const hasBorderControl =
		showBorderColor ||
		showBorderStyle ||
		showBorderWidth ||
		showBorderRadius;

	const label = useBorderPanelLabel( {
		blockName: name,
		hasShadowControl,
		hasBorderControl,
	} );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			label={ label }
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
						enableAlpha
						enableStyle={ showBorderStyle }
						onChange={ onBorderChange }
						popoverOffset={ 40 }
						popoverPlacement="left-start"
						value={ border }
						__experimentalIsRenderedInSidebar
						size="__unstable-large"
						hideLabelFromVision={ ! hasShadowControl }
						label={ __( 'Border' ) }
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
			{ hasShadowControl && (
				<ToolsPanelItem
					label={ __( 'Shadow' ) }
					hasValue={ hasShadow }
					onDeselect={ resetShadow }
					isShownByDefault={ defaultControls.shadow }
					panelId={ panelId }
				>
					{ hasBorderControl ? (
						<BaseControl.VisualLabel as="legend">
							{ __( 'Shadow' ) }
						</BaseControl.VisualLabel>
					) : null }

					<ItemGroup isBordered isSeparated>
						<ShadowPopover
							shadow={ shadow }
							onShadowChange={ setShadow }
							settings={ settings }
						/>
					</ItemGroup>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
