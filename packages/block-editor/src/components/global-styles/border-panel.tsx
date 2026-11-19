import {
	BorderBoxControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalIsDefinedBorder as isDefinedBorder,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	BaseControl,
} from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getValueFromVariable } from '@wordpress/global-styles-engine';
import type { ComponentProps } from 'react';
import BorderRadiusControl from '../border-radius-control';
import { useColorsPerOrigin } from './hooks';
import {
	useToolsPanelDropdownMenuProps,
	useToolsPanelItemPopoverProps,
} from './utils';
import { setImmutably } from '../../utils/object';
import { ShadowPopover, useShadowPresets } from './shadow-panel-components';
import type {
	BorderPanelProps,
	PanelBorderRadius,
	PanelBorderStyle,
	PanelResetAllFilter,
	StyleSettings,
	StyleToolsPanelProps,
	StyleValue,
} from './types';

type BorderBoxValue = ComponentProps< typeof BorderBoxControl >[ 'value' ];

export function useHasBorderPanel( settings: StyleSettings | undefined ) {
	const controls = Object.values( useHasBorderPanelControls( settings ) );
	return controls.some( Boolean );
}

export function useHasBorderPanelControls(
	settings: StyleSettings | undefined
) {
	const controls = {
		hasBorderColor: useHasBorderColorControl( settings ),
		hasBorderRadius: useHasBorderRadiusControl( settings ),
		hasBorderStyle: useHasBorderStyleControl( settings ),
		hasBorderWidth: useHasBorderWidthControl( settings ),
		hasShadow: useHasShadowControl( settings ),
	};

	return controls;
}

function useHasBorderColorControl( settings: StyleSettings | undefined ) {
	return settings?.border?.color;
}

function useHasBorderRadiusControl( settings: StyleSettings | undefined ) {
	return settings?.border?.radius;
}

function useHasBorderStyleControl( settings: StyleSettings | undefined ) {
	return settings?.border?.style;
}

function useHasBorderWidthControl( settings: StyleSettings | undefined ) {
	return settings?.border?.width;
}

function useHasShadowControl( settings: StyleSettings | undefined ) {
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
}: StyleToolsPanelProps ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			// The border panel passes its heading.
			label={ label! }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS: Record< string, boolean > = {
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
	defaultControls = DEFAULT_CONTROLS,
}: BorderPanelProps ) {
	const colors = useColorsPerOrigin( settings );
	const itemPopoverProps = useToolsPanelItemPopoverProps();
	const areCustomSolidsEnabled = settings?.color?.custom;
	const decodeValue = useCallback(
		( rawValue: StyleValue ) =>
			getValueFromVariable( { settings }, '', rawValue ),
		[ settings ]
	);
	const encodeColorValue = ( colorValue: StyleValue ) => {
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
	// Decode a `border` sub-tree (handles split borders + flat shape).
	const decodeBorder = useCallback(
		( source: PanelBorderStyle | undefined ): BorderBoxValue => {
			if ( ! source ) {
				return undefined;
			}
			// The stored border has the shape the control edits.
			if ( hasSplitBorders( source as BorderBoxValue ) ) {
				const out = { ...source };
				( [ 'top', 'right', 'bottom', 'left' ] as const ).forEach(
					( side ) => {
						out[ side ] = {
							...out[ side ],
							color: decodeValue( out[ side ]?.color ),
						};
					}
				);
				// The decoded border holds the colors the control shows.
				return out as BorderBoxValue;
			}
			// The decoded border holds the colors the control shows.
			return {
				...source,
				color: source.color ? decodeValue( source.color ) : undefined,
			} as BorderBoxValue;
		},
		[ decodeValue ]
	);
	// Local-then-inherited: prefer the user's locally-set border (whether
	// flat or split) when defined, otherwise fall back to the inherited
	// Global Styles border. The merge happens at the sub-tree root, not
	// at the leaf level — borders are commonly authored as a single
	// affordance in the inspector, so partial leaf merges would be
	// surprising.
	const localBorder = useMemo(
		() => decodeBorder( value?.border ),
		[ value?.border, decodeBorder ]
	);
	const inheritedBorder = useMemo(
		() => decodeBorder( inheritedValue?.border ),
		[ inheritedValue?.border, decodeBorder ]
	);
	// The stored border has the shape the control edits.
	const isBorderPlaceholder =
		! isDefinedBorder( value?.border as BorderBoxValue ) &&
		!! inheritedBorder &&
		isDefinedBorder( inheritedBorder );
	const border = isBorderPlaceholder ? inheritedBorder : localBorder;
	const setBorder = ( newBorder: PanelBorderStyle | undefined ) =>
		onChange( { ...value, border: newBorder } );
	const showBorderColor = useHasBorderColorControl( settings );
	const showBorderStyle = useHasBorderStyleControl( settings );
	const showBorderWidth = useHasBorderWidthControl( settings );

	// Border radius. Display inherited values through the control's `values`
	// prop when local values are empty so UnitControl can parse the numeric
	// quantity and selected unit normally (e.g. `2.5em` -> `2.5` + `em`).
	// `hasBorderRadius` remains local-only, so displaying the inherited value
	// does not mark the ToolsPanel item as customised or commit on mount.
	const showBorderRadius = useHasBorderRadiusControl( settings );
	const localBorderRadius = useMemo( () => {
		if ( typeof value?.border?.radius !== 'object' ) {
			return decodeValue( value?.border?.radius );
		}
		// An object radius holds each corner.
		return {
			topLeft: decodeValue(
				( value?.border?.radius as PanelBorderRadius )?.topLeft
			),
			topRight: decodeValue(
				( value?.border?.radius as PanelBorderRadius )?.topRight
			),
			bottomLeft: decodeValue(
				( value?.border?.radius as PanelBorderRadius )?.bottomLeft
			),
			bottomRight: decodeValue(
				( value?.border?.radius as PanelBorderRadius )?.bottomRight
			),
		};
	}, [ value?.border?.radius, decodeValue ] );
	const inheritedBorderRadius = useMemo( () => {
		const rawRadius = inheritedValue?.border?.radius;
		if ( typeof rawRadius !== 'object' ) {
			return decodeValue( rawRadius );
		}
		// An object radius holds each corner.
		return {
			topLeft: decodeValue( ( rawRadius as PanelBorderRadius )?.topLeft ),
			topRight: decodeValue(
				( rawRadius as PanelBorderRadius )?.topRight
			),
			bottomLeft: decodeValue(
				( rawRadius as PanelBorderRadius )?.bottomLeft
			),
			bottomRight: decodeValue(
				( rawRadius as PanelBorderRadius )?.bottomRight
			),
		};
	}, [ inheritedValue?.border?.radius, decodeValue ] );
	// Spread the local border, not the merged display value, or setting a
	// radius bakes the inherited border into the local override. Mirror of
	// the guard in `onBorderChange`.
	const setBorderRadius = (
		newBorderRadius: StyleValue | PanelBorderRadius | undefined
	) => setBorder( { ...value?.border, radius: newBorderRadius } );
	const hasBorderRadius = () => {
		const borderValues = value?.border?.radius;
		if ( typeof borderValues === 'object' ) {
			// An object radius holds each corner.
			return Object.entries( borderValues as PanelBorderRadius ).some(
				( [ , v ] ) => !! v
			);
		}
		return !! borderValues;
	};
	const isBorderRadiusPlaceholder =
		! hasBorderRadius() &&
		inheritedBorderRadius !== undefined &&
		inheritedBorderRadius !== '';
	// Build an object value so unlinked-mode shows per-corner inherited
	// values. The control accepts either a string or an object; passing the
	// object form is correct in both modes (the control collapses to the
	// `all`/first corner in linked mode).
	const borderRadius = useMemo( () => {
		if ( ! isBorderRadiusPlaceholder ) {
			return localBorderRadius;
		}
		if ( typeof inheritedBorderRadius === 'string' ) {
			return inheritedBorderRadius;
		}
		const obj = inheritedBorderRadius;
		if ( ! obj ) {
			return localBorderRadius;
		}
		const all =
			obj.topLeft &&
			obj.topLeft === obj.topRight &&
			obj.topLeft === obj.bottomLeft &&
			obj.topLeft === obj.bottomRight
				? obj.topLeft
				: undefined;
		return { all, ...obj };
	}, [
		isBorderRadiusPlaceholder,
		localBorderRadius,
		inheritedBorderRadius,
	] );
	const hasShadowControl = useHasShadowControl( settings );

	// Shadow. At rest, the popover toggle button uses the placeholder
	// treatment, and the popover preset list pre-selects the inherited shadow.
	// The interceptor below recognises the user's "accept inherited" click as
	// an explicit commit, mirroring the ToggleGroup pattern in the typography
	// panel.
	const localShadow = decodeValue( value?.shadow );
	const inheritedShadow = decodeValue( inheritedValue?.shadow );
	const isShadowPlaceholder =
		localShadow === undefined &&
		inheritedShadow !== undefined &&
		inheritedShadow !== '';
	const shadow = isShadowPlaceholder ? inheritedShadow : localShadow;
	// The presets the popover offers, from every origin. A preset the user
	// picked has to be stored as a reference to its CSS variable rather than as
	// the value it resolves to today, otherwise it stops tracking later edits
	// to the preset. Reading the same list the popover renders is what keeps
	// the two in step.
	const shadowPresets = useShadowPresets( settings );
	const setShadow = ( newValue?: string ) => {
		// The list runs default, theme, custom, so searching backwards picks
		// the most specific origin when more than one defines the same shadow
		// value — a newly added custom preset starts out identical to the
		// `natural` default one, and it is the custom slug the user means.
		const slug = shadowPresets.findLast(
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
	// Display-without-commit interceptor for the shadow preset list. When the
	// user is at the at-rest preselect (local is undefined, inherited is the
	// active shadow), `ShadowPresets`' default toggle-off behaviour would
	// interpret the click on the highlighted preset as `undefined` (clear).
	// Re-route it to an explicit commit of the inherited value, so clicking
	// the visible preselected preset is the user's "accept this inherited
	// value" affordance.
	const setShadowWithInheritedCommit = ( newValue?: string ) => {
		if ( isShadowPlaceholder && newValue === undefined ) {
			setShadow( inheritedShadow );
			return;
		}
		setShadow( newValue );
	};
	const hasShadow = () => !! value?.shadow;
	const resetShadow = () => setShadow( undefined );

	const resetBorder = () => {
		if ( hasBorderRadius() ) {
			return setBorder( { radius: value?.border?.radius } );
		}

		setBorder( undefined );
	};

	const onBorderChange = ( newBorder: BorderBoxValue ) => {
		// Ensure we have a visible border style when a border width or
		// color is being selected.
		const updatedBorder: PanelBorderStyle = { ...newBorder };

		// The border is the one the control passed.
		if ( hasSplitBorders( updatedBorder as BorderBoxValue ) ) {
			( [ 'top', 'right', 'bottom', 'left' ] as const ).forEach(
				( side ) => {
					if ( updatedBorder[ side ] ) {
						updatedBorder[ side ] = {
							...updatedBorder[ side ],
							color: encodeColorValue(
								updatedBorder[ side ]?.color
							),
						};
					}
				}
			);
		} else if ( updatedBorder ) {
			updatedBorder.color = encodeColorValue( updatedBorder.color );
		}

		// As radius is maintained separately to color, style, and width
		// maintain its value. Read from `value` (local-only) rather than
		// `border` (the merged display value), otherwise an inherited
		// radius gets baked into the local override every time the
		// user touches color/style/width. That pollutes the stored
		// attribute and marks the radius as set even though the user
		// never customised it. The
		// `radius` key must come after the spread so it wins over any
		// `radius` field forwarded by `BorderBoxControl`'s inner
		// `BorderControl`, which merges its incoming `value` with the
		// changed prop. Undefined values here will be cleaned when
		// global styles are saved.
		setBorder( {
			...updatedBorder,
			radius: value?.border?.radius,
		} );
	};

	const resetAllFilter: PanelResetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				border: undefined,
				shadow: undefined,
			};
		},
		[]
	);

	const showBorderByDefault =
		defaultControls?.color || defaultControls?.width;

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			// A shadow is treated as a soft border, so the panel keeps one
			// name whichever of its controls a theme or block opts into.
			// A stable title is what lets each control show its own label
			// unconditionally, which in turn keeps their unlink toggles
			// aligned.
			label={ __( 'Borders' ) }
		>
			{ ( showBorderWidth || showBorderColor ) && (
				<ToolsPanelItem
					// The stored border has the shape the control edits.
					hasValue={ () =>
						isDefinedBorder( value?.border as BorderBoxValue )
					}
					label={ __( 'Border' ) }
					onDeselect={ () => resetBorder() }
					isShownByDefault={ showBorderByDefault }
					panelId={ panelId }
				>
					{ /* The visible label is always rendered, so the control's
					    linked/unlinked toggle sits in a label row and lines up
					    with the Radius control's. */ }
					<BorderBoxControl
						colors={ colors }
						disableCustomColors={ ! areCustomSolidsEnabled }
						enableAlpha
						enableStyle={ showBorderStyle }
						label={ __( 'Border' ) }
						onChange={ onBorderChange }
						popoverOffset={ itemPopoverProps.offset }
						popoverPlacement={ itemPopoverProps.placement }
						value={ border }
						__experimentalIsRenderedInSidebar
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
						presets={ settings?.border?.radiusSizes }
						values={ borderRadius }
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
					<BaseControl.VisualLabel>
						{ __( 'Shadow' ) }
					</BaseControl.VisualLabel>

					<ShadowPopover
						shadow={ shadow }
						onShadowChange={ setShadowWithInheritedCommit }
						settings={ settings }
						hasLocalValue={ hasShadow() }
						onReset={ resetShadow }
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
