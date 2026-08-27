import {
	BorderBoxControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalIsDefinedBorder as isDefinedBorder,
	__experimentalToolsPanel as ToolsPanel,
	BaseControl,
} from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getValueFromVariable } from '@wordpress/global-styles-engine';
import BorderRadiusControl from '../border-radius-control';
import { useColorsPerOrigin } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import { useBorderPanelLabel } from '../../hooks/border';
import { ShadowPopover, useShadowPresets } from './shadow-panel-components';
import {
	getInheritanceProps,
	InheritanceToolsPanelItem,
	isGlobalStylesInheritanceEnabled,
} from './inheritance';

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
	defaultControls = DEFAULT_CONTROLS,
	showInheritanceLabelIndicators = isGlobalStylesInheritanceEnabled(),
} ) {
	const colors = useColorsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const decodeValue = useCallback(
		( rawValue ) => getValueFromVariable( { settings }, '', rawValue ),
		[ settings ]
	);
	// Always keep the layout className (e.g. `single-column`); only the
	// inheritance treatment is gated on `showInheritanceLabelIndicators`.
	const inheritanceProps = ( isInherited, hasLocalOverride, className ) =>
		getInheritanceProps(
			showInheritanceLabelIndicators && isInherited,
			showInheritanceLabelIndicators && hasLocalOverride,
			className
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
	// Decode a `border` sub-tree (handles split borders + flat shape).
	const decodeBorder = useCallback(
		( source ) => {
			if ( ! source ) {
				return undefined;
			}
			if ( hasSplitBorders( source ) ) {
				const out = { ...source };
				[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
					out[ side ] = {
						...out[ side ],
						color: decodeValue( out[ side ]?.color ),
					};
				} );
				return out;
			}
			return {
				...source,
				color: source.color ? decodeValue( source.color ) : undefined,
			};
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
	const isBorderPlaceholder =
		! isDefinedBorder( value?.border ) &&
		!! inheritedBorder &&
		isDefinedBorder( inheritedBorder );
	const border = isBorderPlaceholder ? inheritedBorder : localBorder;
	const setBorder = ( newBorder ) =>
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
		return {
			topLeft: decodeValue( value?.border?.radius?.topLeft ),
			topRight: decodeValue( value?.border?.radius?.topRight ),
			bottomLeft: decodeValue( value?.border?.radius?.bottomLeft ),
			bottomRight: decodeValue( value?.border?.radius?.bottomRight ),
		};
	}, [ value?.border?.radius, decodeValue ] );
	const inheritedBorderRadius = useMemo( () => {
		const rawRadius = inheritedValue?.border?.radius;
		if ( typeof rawRadius !== 'object' ) {
			return decodeValue( rawRadius );
		}
		return {
			topLeft: decodeValue( rawRadius?.topLeft ),
			topRight: decodeValue( rawRadius?.topRight ),
			bottomLeft: decodeValue( rawRadius?.bottomLeft ),
			bottomRight: decodeValue( rawRadius?.bottomRight ),
		};
	}, [ inheritedValue?.border?.radius, decodeValue ] );
	// Spread the local border, not the merged display value, or setting a
	// radius bakes the inherited border into the local override. Mirror of
	// the guard in `onBorderChange`.
	const setBorderRadius = ( newBorderRadius ) =>
		setBorder( { ...value?.border, radius: newBorderRadius } );
	const hasBorderRadius = () => {
		const borderValues = value?.border?.radius;
		if ( typeof borderValues === 'object' ) {
			return Object.entries( borderValues ).some( ( [ , v ] ) => !! v );
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
	const setShadow = ( newValue ) => {
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
	const setShadowWithInheritedCommit = ( newValue ) => {
		if ( isShadowPlaceholder && newValue === undefined ) {
			setShadow( inheritedShadow );
			return;
		}
		setShadow( newValue );
	};
	const hasShadow = () => !! value?.shadow;
	const resetShadow = () => setShadow( undefined );
	// A local override exists when the user has set a shadow that shadows an
	// inherited one. Only then does the toggle render the blue-dot reset
	// affordance (mirroring the color/gradient controls); a merely-inherited
	// value at rest shows no reset button.
	const hasShadowLocalOverride =
		showInheritanceLabelIndicators &&
		hasShadow() &&
		inheritedShadow !== undefined;

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
		// maintain its value. Read from `value` (local-only) rather than
		// `border` (the merged display value), otherwise an inherited
		// radius gets baked into the local override every time the
		// user touches color/style/width — which both pollutes the
		// stored attribute and causes the radius `ToolsPanelItem` to
		// flip into the `has-local-override-from-global-styles` state
		// even though the user never customised the radius. The
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
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isBorderPlaceholder,
						isDefinedBorder( value?.border ) &&
							!! inheritedBorder &&
							isDefinedBorder( inheritedBorder )
					) }
					hasValue={ () => isDefinedBorder( value?.border ) }
					label={ __( 'Border' ) }
					onDeselect={ () => resetBorder() }
					isShownByDefault={ showBorderByDefault }
					panelId={ panelId }
				>
					{ ( showInheritanceLabelIndicators ||
						hasShadowControl ) && (
						// Render the visible label as `BaseControl.VisualLabel`
						// (which produces `.components-base-control__label`)
						// rather than passing `label` to `BorderBoxControl`,
						// whose internal `<StyledLabel>` carries no stable
						// className. The inheritance treatment and the
						// local-override reset affordance both target
						// `.components-base-control__label`, so the visible
						// "Border" label has to be a `BaseControl` label to
						// receive them.
						//
						// Render it whenever a Shadow control is also present so
						// the two controls stay disambiguated (mirrors the
						// Shadow label's `hasBorderControl` guard below, and
						// trunk's `hideLabelFromVision={ ! hasShadowControl }`),
						// even when inheritance indicators are off (e.g. in
						// Global Styles).
						<BaseControl.VisualLabel as="legend">
							{ __( 'Border' ) }
						</BaseControl.VisualLabel>
					) }
					<BorderBoxControl
						colors={ colors }
						disableCustomColors={ ! areCustomSolidsEnabled }
						enableAlpha
						enableStyle={ showBorderStyle }
						onChange={ onBorderChange }
						popoverOffset={ 40 }
						popoverPlacement="left-start"
						value={ border }
						__experimentalIsRenderedInSidebar
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showBorderRadius && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isBorderRadiusPlaceholder,
						hasBorderRadius() && inheritedBorderRadius !== undefined
					) }
					hasValue={ hasBorderRadius }
					label={ __( 'Radius' ) }
					hasInlineEndToggle
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
				</InheritanceToolsPanelItem>
			) }
			{ hasShadowControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isShadowPlaceholder,
						hasShadow() && inheritedShadow !== undefined
					) }
					label={ __( 'Shadow' ) }
					hasValue={ hasShadow }
					onDeselect={ resetShadow }
					isShownByDefault={ defaultControls.shadow }
					// The shadow toggle renders its own reset affordance (blue
					// dot for a local override, default reset otherwise) inside
					// the control, mirroring the color/gradient controls, so the
					// panel item must not render a second sibling reset dot.
					showLocalOverrideActionsInLabel={ false }
					panelId={ panelId }
				>
					{ hasBorderControl ? (
						<BaseControl.VisualLabel as="legend">
							{ __( 'Shadow' ) }
						</BaseControl.VisualLabel>
					) : null }

					<ShadowPopover
						shadow={ shadow }
						onShadowChange={ setShadowWithInheritedCommit }
						settings={ settings }
						hasLocalValue={ hasShadow() }
						hasLocalOverride={ hasShadowLocalOverride }
						onReset={ resetShadow }
					/>
				</InheritanceToolsPanelItem>
			) }
		</Wrapper>
	);
}
