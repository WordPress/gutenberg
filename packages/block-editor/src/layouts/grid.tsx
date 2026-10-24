import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	Flex,
	FlexItem,
	RangeControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapCSSValue, getGapBoxControlValueFromStyle } from '../hooks/gap';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';
import { cleanEmptyObject, shouldSkipSerialization } from '../hooks/utils';
import { setImmutably } from '../utils/object';
import {
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
} from '../hooks/block-style-state';
import { LAYOUT_DEFINITIONS } from './definitions';
import { store as blockEditorStore } from '../store';
import { useChangeGridColumnCount } from '../components/grid/use-change-grid-column-count';
import { startGridItemDrag } from '../components/grid/start-grid-item-drag';
import { getMobilePlacementResets } from '../components/grid/mobile-stacking';
import type { GridChild } from '../components/grid/mobile-stacking';
import type {
	ChildDragOptions,
	Layout,
	LayoutAlignment,
	LayoutControlProps,
	LayoutInspectorControlsProps,
	LayoutStyleArgs,
} from './types';

/**
 * The part of a grid's style attribute that the stacking toggle reads.
 */
type GridStyle = {
	'@mobile'?: { layout?: { stackOnMobile?: boolean } };
};

/**
 * Gets the CSS that stacks the children of a grid: each child becomes full
 * width, in block order, and unrotated.
 *
 * Each child still spans as many rows as it does in the grid, reading the
 * count from `--wp--grid-item--row-span`, which children of manual grids set.
 * This doesn't make blocks taller, as stacked rows are as tall as their
 * content. It numbers the stacked rows like the stacked layouts that the
 * editor's tools work from and that turning stacking off writes (see
 * `getUnstackedMobileUpdates`), as the tools read the rows from the canvas.
 *
 * @param selector The grid's CSS selector.
 *
 * @return CSS rules, without the media query.
 */
function getStackingStyle( selector: string ): string {
	// The selector is repeated so that the rules beat the grid's and each
	// child's own rules, such as rotation, whatever order the stylesheets end
	// up in.
	const gridSelector = selector
		.split( ',' )
		.map( ( subselector ) => `${ subselector }${ subselector }` )
		.join( ',' );
	const childSelector = selector
		.split( ',' )
		.map( ( subselector ) => `${ subselector }${ subselector } > *` )
		.join( ',' );
	// Stacked blocks are sized by their content again, so the grid stops
	// taking its height from its width, its rows stop being the same height,
	// and it tells its children that their cells are no longer fixed, so
	// blocks that fill fixed cells keep their own size.
	return (
		`${ gridSelector } { aspect-ratio: auto; grid-template-rows: none; grid-auto-rows: auto; --wp--style--grid-cells: auto; }` +
		`${ childSelector } { grid-column: 1 / -1; grid-row: span var(--wp--grid-item--row-span, 1); rotate: none; }`
	);
}

const RANGE_CONTROL_MAX_VALUES: Record< string, number > = {
	px: 600,
	'%': 100,
	vw: 100,
	vh: 100,
	em: 38,
	rem: 38,
	svw: 100,
	lvw: 100,
	dvw: 100,
	svh: 100,
	lvh: 100,
	dvh: 100,
	vi: 100,
	svi: 100,
	lvi: 100,
	dvi: 100,
	vb: 100,
	svb: 100,
	lvb: 100,
	dvb: 100,
	vmin: 100,
	svmin: 100,
	lvmin: 100,
	dvmin: 100,
	vmax: 100,
	svmax: 100,
	lvmax: 100,
	dvmax: 100,
};

const units = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: 'rem', label: 'rem', default: 0 },
	{ value: 'em', label: 'em', default: 0 },
];

/**
 * Checks whether a grid's cells have a fixed size: a manual placement grid
 * that takes its height from its width, as part of the grid interactivity
 * experiment. The grid sets `--wp--style--grid-cells: fixed` for exactly
 * these grids, and blocks in their cells fill them.
 *
 * Cells take their size from the grid's width unless a minimum column width
 * lets the columns wrap into more rows than the grid has.
 *
 * @param {Object} layout The grid's layout, with any viewport overrides merged in.
 * @return {boolean} Whether the grid's cells have a fixed size.
 */
export function hasFixedGridCells( layout?: Layout ): boolean {
	return (
		!! layout?.isManualPlacement &&
		!! window.__experimentalEnableGridInteractivity &&
		! layout.minimumColumnWidth &&
		!! layout.columnCount &&
		!! layout.rowCount
	);
}

export default {
	name: 'grid',
	label: __( 'Grid' ),
	hasInspectorControls() {
		return true;
	},
	inspectorControls: function GridLayoutInspectorControls( {
		layout = {},
		onChange,
		layoutBlockSupport = {},
		resetLayout = {},
		clientId,
	}: LayoutInspectorControlsProps ) {
		const { allowSizingOnChildren = false } = layoutBlockSupport;
		// Stacking only applies on mobile, so it is set for every viewport or
		// for mobile only. The layout panel edits a viewport's layout in a
		// viewport state without a pseudo state, so the toggle is hidden in
		// such states for other viewports. Outside the viewport states, the
		// toggle shows whether the grid stacks on mobile, which its mobile
		// layout can override.
		const {
			isOtherViewportLayoutState,
			isMobileLayoutState,
			mobileStackOverride,
			style,
		} = useSelect(
			( select ) => {
				if ( ! clientId ) {
					return {
						isOtherViewportLayoutState: false,
						isMobileLayoutState: false,
					};
				}
				const { getSelectedBlockStyleState, getBlockAttributes } =
					select( blockEditorStore );
				const selectedState = getSelectedBlockStyleState( clientId );
				const isViewportState =
					hasViewportBlockStyleState( selectedState );
				const isViewportLayoutState =
					isViewportState &&
					! hasPseudoBlockStyleState( selectedState );
				const blockStyle = getBlockAttributes( clientId )?.style as
					GridStyle | undefined;
				return {
					isOtherViewportLayoutState:
						isViewportLayoutState &&
						selectedState.viewport !== '@mobile',
					isMobileLayoutState:
						isViewportLayoutState &&
						selectedState.viewport === '@mobile',
					mobileStackOverride: isViewportState
						? undefined
						: blockStyle?.[ '@mobile' ]?.layout?.stackOnMobile,
					style: blockStyle,
				};
			},
			[ clientId ]
		);
		const registry = useRegistry();
		const {
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		} = useDispatch( blockEditorStore );
		const changeGridColumnCount = useChangeGridColumnCount( clientId );

		// Always show both column and minimum width controls in Auto mode.
		// Manual mode (with isManualPlacement) is only available behind the experiment flag.
		const showColumnsControl = true;
		const showMinWidthControl =
			! layout?.isManualPlacement ||
			window.__experimentalEnableGridInteractivity;
		// Auto-fit/auto-fill only applies when grid items are placed
		// automatically, so the control is irrelevant in manual placement mode.
		const showFillControl = ! layout?.isManualPlacement;
		const defaultColumnCount = layout.isManualPlacement ? 3 : undefined;
		const hasLayoutValue = ( key: string, defaultValue?: unknown ) =>
			( layout?.[ key ] ?? defaultValue ) !==
			( resetLayout?.[ key ] ?? defaultValue );
		const hasGridTypeValue = () =>
			hasLayoutValue( 'isManualPlacement', false );
		const hasColumnsAndRowsValue = () =>
			hasLayoutValue( 'columnCount', defaultColumnCount ) ||
			hasLayoutValue( 'rowCount' );
		const hasMinimumColumnWidthValue = () =>
			hasLayoutValue( 'minimumColumnWidth' );
		const hasFillValue = () => hasLayoutValue( 'autoFit', false );
		const showStackOnMobileControl =
			layout?.isManualPlacement &&
			window.__experimentalEnableGridInteractivity &&
			! isOtherViewportLayoutState;
		const hasStackOnMobileValue = () =>
			hasLayoutValue( 'stackOnMobile', false );
		const isStackedOnMobile =
			( mobileStackOverride ?? layout?.stackOnMobile ) === true;
		const onChangeStackOnMobile = ( value: boolean ) => {
			const nextLayout = cleanEmptyObject( {
				...layout,
				// Stacking is off by default, so outside the viewport states
				// only turning it on is stored. In the mobile state, turning
				// it off is stored too, as it overrides the default state.
				stackOnMobile: isMobileLayoutState ? value : value || undefined,
			} );
			if ( mobileStackOverride === undefined || ! clientId ) {
				onChange( nextLayout );
			} else {
				// The mobile layout's own setting would keep overriding the
				// toggle, so it is removed in the same change.
				updateBlockAttributes( clientId, {
					layout: nextLayout,
					style: cleanEmptyObject(
						setImmutably(
							style,
							[ '@mobile', 'layout', 'stackOnMobile' ],
							undefined
						)
					),
				} );
			}
			if ( ! value || ! clientId ) {
				return;
			}
			// A stacked grid ignores its blocks' mobile placements, such as
			// the ones written when stacking was turned off, so they are
			// removed in the same undo step.
			const { getBlockOrder, getBlockAttributes } =
				registry.select( blockEditorStore );
			const childUpdates = getMobilePlacementResets(
				getBlockOrder( clientId ).map(
					( childClientId: string ): GridChild => ( {
						clientId: childClientId,
						attributes: getBlockAttributes( childClientId ),
					} )
				)
			);
			if ( Object.keys( childUpdates ).length ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes(
					Object.keys( childUpdates ),
					childUpdates,
					/* uniqueByBlock: */ true
				);
			}
		};
		const resetGridType = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					isManualPlacement: resetLayout?.isManualPlacement,
					rowCount: resetLayout?.rowCount,
					minimumColumnWidth: resetLayout?.minimumColumnWidth,
				} )
			);
		const resetColumnsAndRows = () => {
			const columnCount = resetLayout?.columnCount ?? defaultColumnCount;
			// A manual grid with cells of a fixed size keeps its blocks where
			// they are, as when the count is typed, and gets as many rows as
			// keep it about as tall.
			if ( changeGridColumnCount( layout, columnCount, onChange ) ) {
				return;
			}
			onChange(
				cleanEmptyObject( {
					...layout,
					columnCount,
					rowCount: resetLayout?.rowCount,
				} )
			);
		};
		const resetMinimumColumnWidth = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					minimumColumnWidth: resetLayout?.minimumColumnWidth,
				} )
			);
		const resetFill = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					autoFit: resetLayout?.autoFit,
				} )
			);
		const resetStackOnMobile = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					stackOnMobile: resetLayout?.stackOnMobile,
				} )
			);

		return (
			<>
				{ window.__experimentalEnableGridInteractivity && (
					<ToolsPanelItem
						label={ __( 'Grid item position' ) }
						hasValue={ hasGridTypeValue }
						onDeselect={ resetGridType }
						isShownByDefault
						panelId={ clientId }
					>
						<GridLayoutTypeControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
				{ showColumnsControl && (
					<ToolsPanelItem
						label={ __( 'Columns and rows' ) }
						hasValue={ hasColumnsAndRowsValue }
						onDeselect={ resetColumnsAndRows }
						isShownByDefault
						panelId={ clientId }
					>
						<GridLayoutColumnsAndRowsControl
							layout={ layout }
							onChange={ onChange }
							onChangeColumnCount={ ( newColumnCount ) =>
								changeGridColumnCount(
									layout,
									newColumnCount,
									onChange
								)
							}
							allowSizingOnChildren={ allowSizingOnChildren }
						/>
					</ToolsPanelItem>
				) }
				{ showMinWidthControl && (
					<ToolsPanelItem
						label={ __( 'Min. column width' ) }
						hasValue={ hasMinimumColumnWidthValue }
						onDeselect={ resetMinimumColumnWidth }
						isShownByDefault
						panelId={ clientId }
					>
						<GridLayoutMinimumWidthControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
				{ showFillControl && (
					<ToolsPanelItem
						label={ __( 'Fill available space' ) }
						hasValue={ hasFillValue }
						onDeselect={ resetFill }
						panelId={ clientId }
					>
						<GridLayoutFillControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
				{ showStackOnMobileControl && (
					<ToolsPanelItem
						label={ __( 'Stack on mobile' ) }
						hasValue={ hasStackOnMobileValue }
						onDeselect={ resetStackOnMobile }
						isShownByDefault
						panelId={ clientId }
					>
						<ToggleControl
							label={ __( 'Stack on mobile' ) }
							help={ __(
								'On small screens, show each block full width, one after another.'
							) }
							checked={ isStackedOnMobile }
							onChange={ onChangeStackOnMobile }
						/>
					</ToolsPanelItem>
				) }
			</>
		);
	},
	toolBarControls: function GridLayoutToolbarControls() {
		return null;
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		layout = {},
		viewportOverrides,
		viewport,
		style,
		blockName,
		hasBlockGapSupport,
		globalBlockGapValue,
		layoutDefinitions = LAYOUT_DEFINITIONS,
	}: LayoutStyleArgs ): string {
		const hasViewportOverrides = viewportOverrides !== undefined;
		const effectiveLayout = hasViewportOverrides
			? { ...layout, ...viewportOverrides }
			: layout;
		const hasViewportOverride = ( key: string ) =>
			Object.hasOwn( viewportOverrides || {}, key );
		const {
			minimumColumnWidth = null,
			columnCount = null,
			rowCount = null,
			autoFit = false,
		} = effectiveLayout;
		// Manual grids give all their cells the same size, as part of the grid
		// interactivity experiment.
		const hasSameSizeCells =
			!! effectiveLayout.isManualPlacement &&
			!! window.__experimentalEnableGridInteractivity;
		const hasCellsSizedByWidth = hasFixedGridCells( effectiveLayout );
		const baseHasCellsSizedByWidth = hasFixedGridCells( layout );

		// When enabled, columns stretch to fill the available space using
		// `auto-fit`; otherwise empty tracks are preserved with `auto-fill`.
		const autoPlacement = autoFit ? 'auto-fit' : 'auto-fill';

		// Check that the grid layout attributes are of the correct type, so that we don't accidentally
		// write code that stores a string attribute instead of a number.
		if ( process.env.NODE_ENV === 'development' ) {
			if (
				minimumColumnWidth &&
				typeof minimumColumnWidth !== 'string'
			) {
				throw new Error( 'minimumColumnWidth must be a string' );
			}
			if ( columnCount && typeof columnCount !== 'number' ) {
				throw new Error( 'columnCount must be a number' );
			}
			if ( rowCount && typeof rowCount !== 'number' ) {
				throw new Error( 'rowCount must be a number' );
			}
			if ( autoFit && typeof autoFit !== 'boolean' ) {
				throw new Error( 'autoFit must be a boolean' );
			}
		}

		// Use the global blockGap value as fallback when available.
		// If the gap value has both top and left (separated by space), use the left value for horizontal calculations.
		let fallbackGapValue = '1.2rem';
		if ( globalBlockGapValue ) {
			const gapBox =
				getGapBoxControlValueFromStyle( globalBlockGapValue );
			fallbackGapValue =
				getSpacingPresetCssVar( gapBox?.left ) ||
				getSpacingPresetCssVar( gapBox?.top ) ||
				'1.2rem';
		}

		// If a block's block.json skips serialization for spacing or spacing.blockGap,
		// don't apply the user-defined value to the styles.
		const blockGapValue =
			style?.spacing?.blockGap &&
			! shouldSkipSerialization( blockName, 'spacing', 'blockGap' )
				? getGapCSSValue( style?.spacing?.blockGap, fallbackGapValue )
				: undefined;
		const hasBlockGapOverride =
			! hasViewportOverrides ||
			Object.hasOwn( style?.spacing || {}, 'blockGap' );

		let output = '';
		const rules: string[] = [];
		const shouldOutputGridColumns =
			! hasViewportOverrides ||
			hasViewportOverride( 'minimumColumnWidth' ) ||
			hasViewportOverride( 'columnCount' ) ||
			hasViewportOverride( 'autoFit' ) ||
			( hasBlockGapOverride &&
				minimumColumnWidth &&
				// A `null` count compares as `false`.
				( columnCount as number ) > 0 );
		const shouldOutputGridRows =
			( ! hasViewportOverrides ||
				hasViewportOverride( 'rowCount' ) ||
				( hasSameSizeCells &&
					( hasViewportOverride( 'columnCount' ) ||
						hasViewportOverride( 'minimumColumnWidth' ) ) ) ) &&
			columnCount &&
			rowCount;

		if (
			shouldOutputGridColumns &&
			minimumColumnWidth &&
			( columnCount as number ) > 0
		) {
			const blockGapBoxControlValue = blockGapValue
				? // A block gap value comes from the style's block gap.
					getGapBoxControlValueFromStyle( style!.spacing!.blockGap )
				: undefined;
			let blockGapToUse =
				getSpacingPresetCssVar( blockGapBoxControlValue?.left ) ||
				fallbackGapValue;
			// Ensure 0 values have a unit so they work in calc().
			// The gap is a string; the number check is kept from before.
			if (
				blockGapToUse === '0' ||
				( blockGapToUse as string | number ) === 0
			) {
				blockGapToUse = '0px';
			}
			const maxValue = `max(min( ${ minimumColumnWidth }, 100%), ( 100% - (${ blockGapToUse }*${
				// Checked to be above zero just above.
				columnCount! - 1
			}) ) / ${ columnCount })`;
			rules.push(
				`grid-template-columns: repeat(${ autoPlacement }, minmax(${ maxValue }, 1fr))`
			);
		} else if ( shouldOutputGridColumns && columnCount ) {
			rules.push(
				`grid-template-columns: repeat(${ columnCount }, minmax(0, 1fr))`
			);
		} else if ( shouldOutputGridColumns ) {
			rules.push(
				`grid-template-columns: repeat(${ autoPlacement }, minmax(min(${
					minimumColumnWidth || '12rem'
				}, 100%), 1fr))`
			);
		}

		if ( shouldOutputGridColumns ) {
			const baseHasContainerType =
				! layout?.columnCount ||
				( layout?.columnCount && layout?.minimumColumnWidth );
			const needsContainerType = ! columnCount || minimumColumnWidth;
			if (
				needsContainerType &&
				( ! hasViewportOverrides || ! baseHasContainerType )
			) {
				rules.push( 'container-type: inline-size' );
			}
		}

		if ( shouldOutputGridRows && hasSameSizeCells ) {
			// Every row gets the same height, the height of the tallest one, so
			// that all the grid's cells are the same size. Rows added outside
			// the row count match them.
			rules.push(
				`grid-template-rows: repeat(${ rowCount }, minmax(1rem, 1fr))`,
				'grid-auto-rows: minmax(1rem, 1fr)'
			);
			// The grid takes its height from its width, so that cells are
			// close to square and content never makes them bigger. The gaps
			// keep them from being exactly square.
			//
			// `--wp--style--grid-cells` tells the grid's children whether their
			// cells have a fixed size, so that blocks can fill them. Blocks read
			// it with a container style query in their own styles.
			if ( hasCellsSizedByWidth ) {
				rules.push(
					`aspect-ratio: ${ columnCount } / ${ rowCount }`,
					'min-height: 0',
					'--wp--style--grid-cells: fixed'
				);
			} else if ( hasViewportOverrides && baseHasCellsSizedByWidth ) {
				rules.push(
					'aspect-ratio: auto',
					'min-height: auto',
					'--wp--style--grid-cells: auto'
				);
			}
		} else if ( shouldOutputGridRows ) {
			rules.push(
				`grid-template-rows: repeat(${ rowCount }, minmax(1rem, auto))`
			);
		}

		if ( rules.length ) {
			output = `${ appendSelectors( selector ) } { ${ rules.join(
				'; '
			) }; }`;
		}

		// The cell state is inherited, so grids nested inside this one reset
		// it to describe their own cells. A nested grid with fixed cells sets
		// it again, as its own rule is more specific.
		if ( hasSameSizeCells && ! hasViewportOverrides ) {
			output += `:where(${ appendSelectors(
				selector,
				'.is-layout-grid'
			) }) { --wp--style--grid-cells: auto; }`;
			// A block inserted into cells of a fixed size gets enough of them
			// for its placeholder, which then fills them rather than leaving a
			// gap. One rule for the grid covers all its children.
			output += `@container style(--wp--style--grid-cells: fixed) { ${ appendSelectors(
				selector,
				'> * > .components-placeholder'
			) } { min-height: 100%; } }`;
		}

		// Output blockGap styles based on rules contained in layout definitions in theme.json.
		if ( hasBlockGapSupport && hasBlockGapOverride && blockGapValue ) {
			output += getBlockGapCSS(
				selector,
				layoutDefinitions,
				'grid',
				blockGapValue
			);
		}

		// Manual grids stack their children on mobile when they opt in, as
		// part of the grid interactivity experiment. Placement can be
		// switched to auto in the mobile state, so the mobile layout decides.
		if (
			viewport === '@mobile' &&
			hasSameSizeCells &&
			effectiveLayout.stackOnMobile === true
		) {
			output += getStackingStyle( selector );
		}
		return output;
	},
	getOrientation(): string {
		return 'horizontal';
	},
	// The blocks of a manual placement grid sit side by side and on top of
	// each other, so a toolbar floating over each one would cover its
	// neighbors and move with every selection. Their toolbars show over the
	// grid instead.
	capturesToolbars( layout?: Layout ): boolean {
		return (
			!! layout?.isManualPlacement &&
			!! window.__experimentalEnableGridInteractivity
		);
	},
	getAlignments(): LayoutAlignment[] {
		return [];
	},
	/**
	 * A manual grid shows the cells a dragged block will land in, so the block
	 * stays in place instead of following the pointer, as part of the grid
	 * interactivity experiment.
	 *
	 * @param event                       The `dragstart` event.
	 * @param options                     Options.
	 * @param options.layout              The grid's layout.
	 * @param options.clientId            Client ID of the dragged block.
	 * @param options.rootClientId        Client ID of the grid.
	 * @param options.blockElement        The dragged block's element in the canvas.
	 * @param options.startDraggingBlocks Marks blocks as being dragged.
	 * @param options.stopDraggingBlocks  Marks the drag as over.
	 *
	 * @return Whether the grid took over the drag.
	 */
	startChildDrag(
		event: DragEvent,
		{ layout, ...options }: ChildDragOptions & { layout?: Layout }
	): boolean {
		if (
			! layout?.isManualPlacement ||
			! window.__experimentalEnableGridInteractivity
		) {
			return false;
		}
		startGridItemDrag( event, options );
		return true;
	},
};

// Enables setting minimum width of grid items.
function GridLayoutMinimumWidthControl( {
	layout,
	onChange,
}: LayoutControlProps ) {
	const { minimumColumnWidth, columnCount, isManualPlacement } = layout;
	const defaultValue = isManualPlacement || columnCount ? null : '12rem';
	const value = minimumColumnWidth || defaultValue;
	const [ quantity, unit = 'rem' ] =
		// A `null` value parses as no quantity.
		parseQuantityAndUnitFromRawValue( value as string | undefined );

	const handleSliderChange = ( next?: number ) => {
		onChange( {
			...layout,
			minimumColumnWidth: [ next, unit ].join( '' ),
		} );
	};

	// Mostly copied from HeightControl.
	const handleUnitChange = ( newUnit?: string ) => {
		// Attempt to smooth over differences between currentUnit and newUnit.
		// This should slightly improve the experience of switching between unit types.
		let newValue;

		// The unit control always passes a unit.
		if ( [ 'em', 'rem' ].includes( newUnit as string ) && unit === 'px' ) {
			// Convert pixel value to an approximate of the new unit, assuming a root size of 16px.
			// An absent quantity converts to `NaN`, as before.
			newValue = ( ( quantity as number ) / 16 ).toFixed( 2 ) + newUnit;
		} else if ( [ 'em', 'rem' ].includes( unit ) && newUnit === 'px' ) {
			// Convert to pixel value assuming a root size of 16px.
			newValue = Math.round( ( quantity as number ) * 16 ) + newUnit;
		}

		onChange( {
			...layout,
			minimumColumnWidth: newValue,
		} );
	};

	return (
		<fieldset className="block-editor-hooks__grid-layout-minimum-width-control">
			<BaseControl.VisualLabel as="legend">
				{ __( 'Min. column width' ) }
			</BaseControl.VisualLabel>
			<Flex gap={ 4 }>
				<FlexItem isBlock>
					<UnitControl
						onChange={ ( newValue ) => {
							onChange( {
								...layout,
								minimumColumnWidth:
									newValue === '' ? undefined : newValue,
							} );
						} }
						onUnitChange={ handleUnitChange }
						// A `null` value shows an empty field.
						value={ value as string | undefined }
						units={ units }
						min={ 0 }
						label={ __( 'Minimum column width' ) }
						hideLabelFromVision
					/>
				</FlexItem>
				<FlexItem isBlock>
					<RangeControl
						onChange={ handleSliderChange }
						value={ quantity || 0 }
						min={ 0 }
						max={ RANGE_CONTROL_MAX_VALUES[ unit ] || 600 }
						withInputField={ false }
						label={ __( 'Minimum column width' ) }
						hideLabelFromVision
					/>
				</FlexItem>
			</Flex>
			<p className="components-base-control__help">
				{ __(
					'Columns will wrap to fewer per row when they can no longer maintain the minimum width.'
				) }
			</p>
		</fieldset>
	);
}

// Enables setting number of grid columns
function GridLayoutColumnsAndRowsControl( {
	layout,
	onChange,
	onChangeColumnCount,
	allowSizingOnChildren,
}: LayoutControlProps & {
	allowSizingOnChildren?: boolean;
	/**
	 * Changes the column count, and returns whether it did. Manual grids with
	 * cells of a fixed size keep their blocks in place.
	 */
	onChangeColumnCount?: ( columnCount: number | undefined ) => boolean;
} ) {
	// Allow unsetting the column count in Auto mode.
	const defaultColumnCount = undefined;
	const {
		columnCount = defaultColumnCount,
		rowCount,
		isManualPlacement,
	} = layout;

	return (
		<>
			<fieldset className="block-editor-hooks__grid-layout-columns-and-rows-controls">
				{ ! isManualPlacement && (
					<BaseControl.VisualLabel as="legend">
						{ __( 'Max. columns' ) }
					</BaseControl.VisualLabel>
				) }
				<Flex gap={ 4 }>
					<FlexItem isBlock>
						<NumberControl
							onChange={ ( value ) => {
								// Allow unsetting the column count when in auto mode.
								const defaultNewColumnCount = isManualPlacement
									? 1
									: undefined;
								const newColumnCount =
									value === '' || value === '0'
										? defaultNewColumnCount
										: // Only an absent value is not a string.
											parseInt( value as string, 10 );
								if ( onChangeColumnCount?.( newColumnCount ) ) {
									return;
								}
								onChange( {
									...layout,
									columnCount: newColumnCount,
								} );
							} }
							value={ columnCount ?? '' }
							// A new column count rearranges a manual grid's
							// blocks, so a typed count only applies when
							// it's committed with Enter or by leaving the field,
							// and not for each digit on the way to it.
							isPressEnterToChange={
								isManualPlacement &&
								window.__experimentalEnableGridInteractivity
							}
							min={ 1 }
							label={ __( 'Columns' ) }
							hideLabelFromVision={ ! isManualPlacement }
						/>
					</FlexItem>

					<FlexItem isBlock>
						{ allowSizingOnChildren && isManualPlacement ? (
							<NumberControl
								onChange={ ( value ) => {
									// Don't allow unsetting the row count.
									const newRowCount =
										value === '' || value === '0'
											? 1
											: // Only an absent value is not a string.
												parseInt( value as string, 10 );
									onChange( {
										...layout,
										rowCount: newRowCount,
									} );
								} }
								// A `null` count shows an empty field.
								value={ rowCount as number | undefined }
								min={ 1 }
								label={ __( 'Rows' ) }
							/>
						) : (
							<RangeControl
								value={ columnCount ?? 1 }
								onChange={ ( value ) =>
									onChange( {
										...layout,
										columnCount:
											// The string checks are kept from before.
											( value as
												| number
												| string
												| undefined ) === '' ||
											( value as
												| number
												| string
												| undefined ) === '0'
												? 1
												: value,
									} )
								}
								min={ 1 }
								max={ 16 }
								withInputField={ false }
								label={ __( 'Columns' ) }
								hideLabelFromVision
							/>
						) }
					</FlexItem>
				</Flex>
			</fieldset>
		</>
	);
}

// Enables stretching grid columns to fill the available space (auto-fit)
// instead of leaving empty tracks at the end of a row (auto-fill).
function GridLayoutFillControl( { layout, onChange }: LayoutControlProps ) {
	const { autoFit = false } = layout;

	return (
		<ToggleControl
			label={ __( 'Fill available space' ) }
			help={ __(
				'Stretch columns to fill the available space, instead of leaving gaps when there are too few items to fill a row.'
			) }
			checked={ autoFit }
			onChange={ ( value ) =>
				onChange( {
					...layout,
					autoFit: value,
				} )
			}
		/>
	);
}

// Enables switching between grid types
function GridLayoutTypeControl( { layout, onChange }: LayoutControlProps ) {
	const { columnCount, rowCount, minimumColumnWidth, isManualPlacement } =
		layout;

	/**
	 * When switching, temporarily save any custom values set on the
	 * previous type so we can switch back without loss.
	 */
	const [ tempColumnCount, setTempColumnCount ] = useState(
		columnCount || 3
	);
	const [ tempRowCount, setTempRowCount ] = useState( rowCount );
	const [ tempMinimumColumnWidth, setTempMinimumColumnWidth ] = useState(
		minimumColumnWidth || '12rem'
	);

	const gridPlacement = isManualPlacement ? 'manual' : 'auto';

	const onChangeType = ( value?: string | number ) => {
		if ( value === 'manual' ) {
			setTempMinimumColumnWidth( minimumColumnWidth || '12rem' );
		} else {
			setTempColumnCount( columnCount || 3 );
			setTempRowCount( rowCount );
		}
		onChange( {
			...layout,
			// The column count is kept, so that a manual grid's blocks keep
			// the places they were given for it. Only an auto grid without a
			// count takes the saved one.
			columnCount: columnCount || tempColumnCount,
			rowCount: value === 'manual' ? tempRowCount : undefined,
			isManualPlacement: value === 'manual' ? true : undefined,
			minimumColumnWidth:
				value === 'auto' ? tempMinimumColumnWidth : null,
		} );
	};

	const helpText =
		gridPlacement === 'manual'
			? __(
					'Grid items can be manually placed in any position on the grid.'
				)
			: __(
					'Grid items are placed automatically depending on their order.'
				);

	return (
		<ToggleGroupControl
			label={ __( 'Grid item position' ) }
			value={ gridPlacement }
			onChange={ onChangeType }
			isBlock
			help={ helpText }
		>
			<ToggleGroupControlOption
				key="auto"
				value="auto"
				label={ __( 'Auto' ) }
			/>
			<ToggleGroupControlOption
				key="manual"
				value="manual"
				label={ __( 'Manual' ) }
			/>
		</ToggleGroupControl>
	);
}
