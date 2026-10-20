import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import {
	getValueFromObjectPath,
	isPlainObject,
	setImmutably,
} from '../utils/object';
import { useStyleOverride } from './utils';
import { useLayout } from '../components/block-list/layout';
import {
	GridVisualizer,
	GridItemResizer,
	GridItemMovers,
	GridItemRotator,
	GridItemDragHandle,
	GridItemDeleteHandle,
	GridItemHandles,
	useUpdateGridChildLayout,
	isGridStackedOnMobile,
	getStackedLayouts,
} from '../components/grid';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import useBlockVisibility from '../components/block-visibility/use-block-visibility';
import { deviceTypeKey } from '../store/private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../components/block-visibility/constants';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
	setStyleForState,
} from './block-style-state';
import {
	getRotateForState,
	getUpdatedRotateStyle,
	isRotateEnabled,
} from './rotate';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

// Used for generating the instance ID
const LAYOUT_CHILD_BLOCK_PROPS_REFERENCE = {};

// These are the serialized `selfStretch` values. `max` used to be called
// "Fixed" in the UI, but was renamed and replaced by `fixedNoShrink`.
const FLEX_CHILD_LAYOUT_VALUES = {
	fit: 'fit',
	grow: 'fill',
	max: 'fixed',
	fixed: 'fixedNoShrink',
};

const FLEX_SIZE_VALUES = [
	FLEX_CHILD_LAYOUT_VALUES.max,
	FLEX_CHILD_LAYOUT_VALUES.fixed,
];

function isFlexSizeValue( value ) {
	return FLEX_SIZE_VALUES.includes( value );
}

function serializeRule( { selector, declarations } ) {
	return `${ selector } {
		${ Object.entries( declarations )
			.map( ( [ property, value ] ) => `${ property }: ${ value }` )
			.join( '; ' ) };
	}`;
}

const GRID_PLACEMENT_KEYS = [
	'columnStart',
	'columnSpan',
	'rowStart',
	'rowSpan',
];

/**
 * Gets the box of a manual grid item in a state: where it is inside its
 * cells when it doesn't fill them. The box belongs to the placement, so a
 * viewport override that sets any part of the placement also sets the box,
 * and has none if it doesn't include one.
 *
 * @param {Object}           layout            The item's base child layout.
 * @param {Object|undefined} viewportOverrides The child layout of a viewport, if any.
 *
 * @return {Object|undefined} The box, with `left`, `top`, `width` and `height`.
 */
export function getGridItemBox( layout = {}, viewportOverrides ) {
	const ownsPlacement =
		viewportOverrides &&
		GRID_PLACEMENT_KEYS.some( ( key ) =>
			Object.hasOwn( viewportOverrides, key )
		);
	return ( ownsPlacement ? viewportOverrides : layout )?.box ?? undefined;
}

/**
 * Checks whether a manual grid item has a box in any state.
 *
 * @param {Object|undefined} style The item's style attribute.
 *
 * @return {boolean} Whether the item has a box in its base layout or a viewport's.
 */
export function hasGridItemBoxInAnyState( style ) {
	if ( ! style ) {
		return false;
	}
	return Object.entries( style ).some(
		( [ key, value ] ) =>
			( key === 'layout' || key.startsWith( '@' ) ) &&
			!! ( key === 'layout' ? value : value?.layout )?.box
	);
}

function toPercent( fraction ) {
	return `${ Math.round( fraction * 1e5 ) / 1e3 }%`;
}

/**
 * Gets the custom properties that place a manual grid item inside its cells,
 * or that make it fill them when it has no box.
 *
 * @param {Object|undefined} box The item's box.
 *
 * @return {Object} The declarations.
 */
function getGridItemBoxDeclarations( box ) {
	return {
		'--wp--grid-item--box-left': toPercent( box?.left ?? 0 ),
		'--wp--grid-item--box-top': toPercent( box?.top ?? 0 ),
		'--wp--grid-item--box-width': toPercent( box?.width ?? 1 ),
		'--wp--grid-item--box-height': toPercent( box?.height ?? 1 ),
	};
}

export function getChildLayoutStyleRules( {
	selector,
	layout = {},
	viewportOverrides,
	parentLayout = {},
	includeContainerQuery = true,
	hasBox = false,
} ) {
	const hasViewportOverrides = viewportOverrides !== undefined;
	const effectiveLayout = hasViewportOverrides
		? {
				...layout,
				...viewportOverrides,
			}
		: layout;
	const hasViewportOverride = ( key ) =>
		Object.hasOwn( viewportOverrides || {}, key );
	const {
		selfStretch,
		flexSize,
		columnStart,
		rowStart,
		columnSpan,
		rowSpan,
	} = effectiveLayout;
	const baseSelfStretch = layout.selfStretch;
	const { columnCount, minimumColumnWidth, isManualPlacement } = parentLayout;
	const rules = [];

	const declarations = {};
	if (
		! hasViewportOverrides ||
		hasViewportOverride( 'selfStretch' ) ||
		hasViewportOverride( 'flexSize' )
	) {
		if (
			hasViewportOverrides &&
			( selfStretch === FLEX_CHILD_LAYOUT_VALUES.fit ||
				selfStretch === FLEX_CHILD_LAYOUT_VALUES.grow ) &&
			isFlexSizeValue( baseSelfStretch ) &&
			layout.flexSize
		) {
			declarations[ 'flex-basis' ] = 'unset';
			if ( baseSelfStretch === FLEX_CHILD_LAYOUT_VALUES.fixed ) {
				declarations[ 'flex-shrink' ] = 'unset';
			}
		}
		if ( isFlexSizeValue( selfStretch ) && flexSize ) {
			declarations[ 'flex-basis' ] = flexSize;
			if ( selfStretch === FLEX_CHILD_LAYOUT_VALUES.fixed ) {
				declarations[ 'flex-shrink' ] = '0';
			} else if (
				hasViewportOverrides &&
				baseSelfStretch === FLEX_CHILD_LAYOUT_VALUES.fixed
			) {
				declarations[ 'flex-shrink' ] = 'unset';
			}
			declarations[ 'box-sizing' ] = 'border-box';
		} else if ( selfStretch === FLEX_CHILD_LAYOUT_VALUES.grow ) {
			declarations[ 'flex-grow' ] = '1';
		}
	}

	if (
		! hasViewportOverrides ||
		hasViewportOverride( 'columnStart' ) ||
		hasViewportOverride( 'columnSpan' )
	) {
		if ( columnStart && columnSpan ) {
			declarations[ 'grid-column' ] =
				`${ columnStart } / span ${ columnSpan }`;
		} else if ( columnStart ) {
			declarations[ 'grid-column' ] = `${ columnStart }`;
		} else if ( columnSpan ) {
			declarations[ 'grid-column' ] = `span ${ columnSpan }`;
		}
	}

	if (
		! hasViewportOverrides ||
		hasViewportOverride( 'rowStart' ) ||
		hasViewportOverride( 'rowSpan' )
	) {
		if ( rowStart && rowSpan ) {
			declarations[ 'grid-row' ] = `${ rowStart } / span ${ rowSpan }`;
		} else if ( rowStart ) {
			declarations[ 'grid-row' ] = `${ rowStart }`;
		} else if ( rowSpan ) {
			declarations[ 'grid-row' ] = `span ${ rowSpan }`;
		}
	}

	// Manual grids stack their children on mobile, as part of the grid
	// interactivity experiment, with a rule on the grid that reads each
	// child's row span from this custom property so that tall blocks stay
	// tall. It is always set, so that a child doesn't inherit the row span of
	// a grid it is nested in.
	if (
		! hasViewportOverrides &&
		isManualPlacement &&
		window.__experimentalEnableGridInteractivity
	) {
		declarations[ '--wp--grid-item--row-span' ] = `${ rowSpan || 1 }`;
	}

	// A block placed freely in a manual grid sits inside its cells, with
	// margins and a size that are percentages of them. They are custom
	// properties, so that a viewport can change them, and they only apply
	// where the cells have a fixed size: grids whose rows are sized by their
	// content, and stacked grids, leave blocks to fill their cells.
	const hasGridItemBox =
		hasBox &&
		isManualPlacement &&
		window.__experimentalEnableGridInteractivity;
	if (
		hasGridItemBox &&
		( ! hasViewportOverrides ||
			GRID_PLACEMENT_KEYS.some( hasViewportOverride ) )
	) {
		Object.assign(
			declarations,
			getGridItemBoxDeclarations(
				getGridItemBox( layout, viewportOverrides )
			)
		);
	}

	if ( Object.keys( declarations ).length ) {
		rules.push( { selector, declarations } );
	}

	if ( hasGridItemBox && ! hasViewportOverrides ) {
		rules.push( {
			rulesGroup: '@container style(--wp--style--grid-cells: fixed)',
			selector,
			declarations: {
				'justify-self': 'start',
				'align-self': 'start',
				'box-sizing': 'border-box',
				'margin-left': 'var(--wp--grid-item--box-left)',
				'margin-top': 'var(--wp--grid-item--box-top)',
				width: 'var(--wp--grid-item--box-width)',
				height: 'var(--wp--grid-item--box-height)',
			},
		} );
	}

	if ( includeContainerQuery && ! hasViewportOverrides ) {
		/**
		 * If minimumColumnWidth is set on the parent, or if no
		 * columnCount is set, the grid is responsive so a
		 * container query is needed for the span to resize.
		 */
		if (
			( columnSpan || columnStart ) &&
			( minimumColumnWidth || ! columnCount )
		) {
			let parentColumnValue = parseFloat( minimumColumnWidth );
			/**
			 * 12rem is the default minimumColumnWidth value.
			 * If parentColumnValue is not a number, default to 12.
			 */
			if ( isNaN( parentColumnValue ) ) {
				parentColumnValue = 12;
			}

			let parentColumnUnit = minimumColumnWidth?.replace(
				parentColumnValue,
				''
			);
			/**
			 * Check that parent column unit is either 'px', 'rem' or 'em'.
			 * If not, default to 'rem'.
			 */
			if ( ! [ 'px', 'rem', 'em' ].includes( parentColumnUnit ) ) {
				parentColumnUnit = 'rem';
			}

			let numColsToBreakAt = 2;

			if ( columnSpan && columnStart ) {
				numColsToBreakAt = columnSpan + columnStart - 1;
			} else if ( columnSpan ) {
				numColsToBreakAt = columnSpan;
			} else {
				numColsToBreakAt = columnStart;
			}

			const defaultGapValue = parentColumnUnit === 'px' ? 24 : 1.5;
			const containerQueryValue =
				numColsToBreakAt * parentColumnValue +
				( numColsToBreakAt - 1 ) * defaultGapValue;
			// For blocks that only span one column, we want to remove any rowStart values as
			// the container reduces in size, so that blocks are still arranged in markup order.
			const minimumContainerQueryValue =
				parentColumnValue * 2 + defaultGapValue - 1;
			// If a span is set we want to preserve it as long as possible, otherwise we just reset the value.
			const gridColumnValue =
				columnSpan && columnSpan > 1 ? '1/-1' : 'auto';

			rules.push( {
				rulesGroup: `@container (max-width: ${ Math.max(
					containerQueryValue,
					minimumContainerQueryValue
				) }${ parentColumnUnit })`,
				selector,
				declarations: {
					'grid-column': gridColumnValue,
					'grid-row': 'auto',
				},
			} );
		}
	}

	return rules;
}

export function getChildLayoutStyles( {
	selector,
	layout = {},
	parentLayout = {},
	includeContainerQuery = true,
	hasBox = false,
} ) {
	return getChildLayoutStyleRules( {
		selector,
		layout,
		parentLayout,
		includeContainerQuery,
		hasBox,
	} )
		.map( ( rule ) => {
			const serializedRule = serializeRule( rule );
			return rule.rulesGroup
				? `${ rule.rulesGroup } {
				${ serializedRule }
			}`
				: serializedRule;
		} )
		.join( '' );
}

export function getResponsiveChildLayoutStyles( {
	style = {},
	selector,
	parentLayout = {},
	viewportSettings,
} ) {
	const baseLayout = style?.layout ?? {};
	const hasBox = hasGridItemBoxInAnyState( style );

	return Object.entries( getResponsiveMediaQueries( viewportSettings ) )
		.map( ( [ viewport, mediaQuery ] ) => {
			const viewportLayout = getStyleForState( style, {
				viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} )?.layout;
			if ( ! viewportLayout || ! Object.keys( viewportLayout ).length ) {
				return '';
			}

			const viewportRules = getChildLayoutStyleRules( {
				selector,
				layout: baseLayout,
				viewportOverrides: viewportLayout,
				parentLayout,
				includeContainerQuery: false,
				hasBox,
			} );
			const css = viewportRules.map( serializeRule ).join( '' );

			return css ? `${ mediaQuery }{${ css }}` : '';
		} )
		.filter( Boolean )
		.join( '' );
}

/**
 * Merges child layout changes into the active layout style state.
 *
 * @param {Object|undefined} style         Block style attributes.
 * @param {Object}           layout        Child layout changes.
 * @param {Object}           selectedState Selected block style state.
 * @return {Object|undefined} Updated block style attributes.
 */
export function getUpdatedChildLayoutStyle( style, layout, selectedState ) {
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return {
			...style,
			layout: {
				...style?.layout,
				...layout,
			},
		};
	}

	const layoutState = {
		viewport: selectedState.viewport,
		pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
	};
	const stateStyle = getStyleForState( style, layoutState );

	return setStyleForState( style, layoutState, {
		...stateStyle,
		layout: {
			...stateStyle?.layout,
			...layout,
		},
	} );
}

function useBlockPropsChildLayoutStyles( { style } ) {
	const { shouldRenderChildLayoutStyles, viewportSettings } = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			return {
				shouldRenderChildLayoutStyles: ! settings.disableLayoutStyles,
				viewportSettings: settings?.__experimentalFeatures?.viewport,
			};
		}
	);
	const layout = style?.layout ?? {};
	const { columnStart, rowStart, columnSpan, rowSpan } = layout;
	const parentLayout = useLayout() || {};
	const id = useInstanceId( LAYOUT_CHILD_BLOCK_PROPS_REFERENCE );
	const selector = `.wp-container-content-${ id }`;

	// Check that the grid layout attributes are of the correct type, so that we don't accidentally
	// write code that stores a string attribute instead of a number.
	if ( process.env.NODE_ENV === 'development' ) {
		if ( columnStart && typeof columnStart !== 'number' ) {
			throw new Error( 'columnStart must be a number' );
		}
		if ( rowStart && typeof rowStart !== 'number' ) {
			throw new Error( 'rowStart must be a number' );
		}
		if ( columnSpan && typeof columnSpan !== 'number' ) {
			throw new Error( 'columnSpan must be a number' );
		}
		if ( rowSpan && typeof rowSpan !== 'number' ) {
			throw new Error( 'rowSpan must be a number' );
		}
		if (
			layout.box &&
			[ 'left', 'top', 'width', 'height' ].some(
				( key ) => typeof layout.box[ key ] !== 'number'
			)
		) {
			throw new Error( 'box values must be numbers' );
		}
	}

	let css = '';
	if ( shouldRenderChildLayoutStyles ) {
		css = [
			getChildLayoutStyles( {
				selector,
				layout,
				parentLayout,
				hasBox: hasGridItemBoxInAnyState( style ),
			} ),
			getResponsiveChildLayoutStyles( {
				style,
				selector,
				parentLayout,
				viewportSettings,
			} ),
		].join( '' );
	}

	// A block in a manual placement grid stays in place while it is dragged,
	// so the browser's drag image must not show. WebKit ignores the drag
	// image set for a block when the drag starts on an image, and shows the
	// image instead, so images leave the drag to the block.
	if (
		parentLayout.type === 'grid' &&
		parentLayout.isManualPlacement &&
		window.__experimentalEnableGridInteractivity
	) {
		css += `${ selector } img { -webkit-user-drag: none; }`;
		// A block inserted into cells of a fixed size gets enough of them for
		// its placeholder, which then fills them rather than leaving a gap.
		css += `@container style(--wp--style--grid-cells: fixed) { ${ selector } > .components-placeholder { min-height: 100%; } }`;
	}

	useStyleOverride( { css } );

	// Only attach a container class if there is generated CSS to be attached.
	if ( ! css ) {
		return;
	}

	// Attach a `wp-container-content` id-based classname.
	return { className: `wp-container-content-${ id }` };
}

function ChildLayoutControlsPure( { clientId, name, style } ) {
	const parentLayout = useLayout() || {};
	const {
		type: parentLayoutType = 'default',
		allowSizingOnChildren = false,
		isManualPlacement,
	} = parentLayout;

	if ( parentLayoutType !== 'grid' ) {
		return null;
	}

	return (
		<GridTools
			clientId={ clientId }
			name={ name }
			style={ style }
			allowSizingOnChildren={ allowSizingOnChildren }
			isManualPlacement={ isManualPlacement }
			parentLayout={ parentLayout }
		/>
	);
}

function GridTools( {
	clientId,
	name,
	style,
	allowSizingOnChildren,
	isManualPlacement,
	parentLayout,
} ) {
	const {
		rootClientId,
		isVisible,
		parentBlockVisibility,
		blockBlockVisibility,
		deviceType,
		viewportSettings,
		isChildBlockAGrid,
		selectedState,
		parentStyle,
		blockEditingMode,
		canMove,
		canRemove,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockEditingMode,
				getTemplateLock,
				getBlockAttributes,
				getSettings,
				getSelectedBlockStyleState,
				canMoveBlock,
				canRemoveBlock,
			} = unlock( select( blockEditorStore ) );
			const _rootClientId = getBlockRootClientId( clientId );

			if (
				getTemplateLock( _rootClientId ) ||
				getBlockEditingMode( _rootClientId ) !== 'default'
			) {
				return {
					rootClientId: _rootClientId,
					isVisible: false,
				};
			}

			const parentAttributes = getBlockAttributes( _rootClientId );
			const blockAttributes = getBlockAttributes( clientId );
			const settings = getSettings();
			const currentDeviceType =
				settings?.[ deviceTypeKey ]?.toLowerCase() ||
				BLOCK_VISIBILITY_VIEWPORTS.desktop.key;

			return {
				rootClientId: _rootClientId,
				isVisible: true,
				parentBlockVisibility:
					parentAttributes?.metadata?.blockVisibility,
				blockBlockVisibility:
					blockAttributes?.metadata?.blockVisibility,
				deviceType: currentDeviceType,
				viewportSettings: settings?.__experimentalFeatures?.viewport,
				// Check if the selected child block is itself a grid.
				isChildBlockAGrid: blockAttributes?.layout?.type === 'grid',
				selectedState: getSelectedBlockStyleState( clientId ),
				parentStyle: parentAttributes?.style,
				blockEditingMode: getBlockEditingMode( clientId ),
				canMove: canMoveBlock( clientId ),
				canRemove: canRemoveBlock( clientId ),
			};
		},
		[ clientId ]
	);

	// Get the block's DOM element to derive the canvas iframe window,
	// so viewport detection matches the actual block rendering context
	const blockElement = useBlockElement( clientId );
	const rawCanvasView = blockElement?.ownerDocument?.defaultView;
	const canvasView = rawCanvasView === null ? undefined : rawCanvasView;

	const {
		isBlockCurrentlyHidden: isParentBlockCurrentlyHidden,
		currentViewport,
	} = useBlockVisibility( {
		blockVisibility: parentBlockVisibility,
		deviceType,
		view: canvasView,
		viewportSettings,
	} );

	// Check whether any ancestor of the parent grid is hidden at the viewport
	// actually detected from the canvas, so it stays consistent with how
	// blocks are hidden.
	const isAnyAncestorHidden = useSelect(
		( select ) => {
			if ( ! rootClientId ) {
				return false;
			}
			const { isBlockParentHiddenAtViewport } = unlock(
				select( blockEditorStore )
			);
			return isBlockParentHiddenAtViewport(
				rootClientId,
				currentViewport
			);
		},
		[ rootClientId, currentViewport ]
	);

	const { isBlockCurrentlyHidden: isBlockItselfCurrentlyHidden } =
		useBlockVisibility( {
			blockVisibility: blockBlockVisibility,
			deviceType,
			view: canvasView,
			viewportSettings,
		} );

	// Use useState() instead of useRef() so that GridItemResizer updates when ref is set.
	const [ resizerBounds, setResizerBounds ] = useState();
	// The angle shown while the rotate handle is being dragged.
	const [ previewRotate, setPreviewRotate ] = useState( null );

	const childGridClientId = isChildBlockAGrid ? clientId : undefined;

	const isManualGrid =
		isManualPlacement && window.__experimentalEnableGridInteractivity;
	// On mobile, a stacked grid shows every block full width, one after
	// another. The tools work from that stack: the first edit gives the grid
	// its own mobile layout matching it (see `useUpdateGridChildLayout`).
	const isStackedOnMobile =
		selectedState?.viewport === '@mobile' &&
		isGridStackedOnMobile( parentLayout, parentStyle );
	const siblings = useSelect(
		( select ) => {
			if ( ! isStackedOnMobile ) {
				return undefined;
			}
			const { getBlockOrder, getBlocksByClientId } =
				select( blockEditorStore );
			return getBlocksByClientId( getBlockOrder( rootClientId ) );
		},
		[ isStackedOnMobile, rootClientId ]
	);
	const stackedLayouts = useMemo(
		() =>
			isStackedOnMobile && siblings
				? getStackedLayouts(
						{ layout: parentLayout, style: parentStyle },
						siblings,
						clientId
					)
				: null,
		[ isStackedOnMobile, siblings, clientId, parentLayout, parentStyle ]
	);
	const updateGridChildLayout = useUpdateGridChildLayout();

	if ( ! isVisible || isParentBlockCurrentlyHidden || isAnyAncestorHidden ) {
		return null;
	}

	const showResizer = allowSizingOnChildren && ! isBlockItselfCurrentlyHidden;
	const isViewportState = hasViewportBlockStyleState( selectedState );
	// The layout the canvas shows for this block and its grid in the
	// selected state.
	const viewportLayout = isViewportState
		? getStyleForState( style, {
				viewport: selectedState.viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} )?.layout
		: undefined;
	const effectiveLayout = stackedLayouts?.child ?? {
		...style?.layout,
		...viewportLayout,
		// A viewport that sets its own place has its own box, or none.
		box: getGridItemBox( style?.layout, viewportLayout ),
	};
	const effectiveParentLayout = {
		...parentLayout,
		...( isViewportState
			? parentStyle?.[ selectedState.viewport ]?.layout
			: undefined ),
		...stackedLayouts?.grid,
	};
	// Stacked blocks are shown unrotated.
	const rotate = isStackedOnMobile
		? 0
		: getRotateForState( style, selectedState );
	// Like the Rotation control in the block settings, the handle is only
	// offered for blocks that can be fully edited, and not in a state such as
	// `:hover`, since rotation is stored per viewport.
	const showRotator =
		isManualGrid &&
		! isBlockItselfCurrentlyHidden &&
		blockEditingMode === 'default' &&
		! hasPseudoBlockStyleState( selectedState ) &&
		isRotateEnabled( name );

	// Text blocks can't be dragged by their body, so every block that can be
	// moved gets a handle that drags it the way a body drag does.
	const showDragHandle =
		isManualGrid && ! isBlockItselfCurrentlyHidden && canMove;
	const showDeleteHandle =
		isManualGrid && ! isBlockItselfCurrentlyHidden && canRemove;

	function updateLayout( layout ) {
		updateGridChildLayout( clientId, layout );
	}

	function updateRotate( angle ) {
		// Goes through the grid item update, so that rotating a block of a
		// stacked grid on mobile first gives the grid its own mobile layout.
		updateGridChildLayout( clientId, ( childStyle, state ) =>
			getUpdatedRotateStyle( childStyle, angle, state )
		);
	}

	return (
		<>
			<GridVisualizer
				clientId={ rootClientId }
				contentRef={ setResizerBounds }
				parentLayout={ parentLayout }
				childGridClientId={ childGridClientId }
			/>
			{ showResizer && (
				<GridItemResizer
					clientId={ clientId }
					// Don't allow resizing beyond the grid visualizer.
					bounds={ resizerBounds }
					onChange={ updateLayout }
					parentLayout={ parentLayout }
					angle={ previewRotate ?? rotate }
				/>
			) }
			{ ( showDragHandle || showRotator || showDeleteHandle ) && (
				<GridItemHandles
					clientId={ clientId }
					angle={ previewRotate ?? rotate }
					anchorAngle={ rotate }
				>
					{ showDragHandle && (
						<GridItemDragHandle
							clientId={ clientId }
							gridClientId={ rootClientId }
						/>
					) }
					{ showRotator && (
						<GridItemRotator
							clientId={ clientId }
							angle={ rotate }
							onPreview={ setPreviewRotate }
							onChange={ updateRotate }
						/>
					) }
					{ showDeleteHandle && (
						<GridItemDeleteHandle clientId={ clientId } />
					) }
				</GridItemHandles>
			) }
			{ isManualGrid && (
				<GridItemMovers
					layout={ effectiveLayout }
					parentLayout={ effectiveParentLayout }
					onChange={ updateLayout }
					gridClientId={ rootClientId }
					blockClientId={ clientId }
				/>
			) }
		</>
	);
}

/**
 * Returns the child layout of a block style: the default layout and the
 * layout of each viewport state, keyed by their path in the style object.
 *
 * @param {Object|undefined} style Block style attributes.
 * @return {Array} Pairs of style object path and child layout.
 */
function getChildLayoutEntries( style ) {
	if ( ! isPlainObject( style ) ) {
		return [];
	}

	const entries = [];
	if ( isPlainObject( style.layout ) ) {
		entries.push( [ [ 'layout' ], style.layout ] );
	}
	Object.entries( style ).forEach( ( [ key, stateStyle ] ) => {
		// Viewport states (`@mobile`, `@tablet`) hold their own child layout.
		if (
			key.startsWith( '@' ) &&
			isPlainObject( stateStyle ) &&
			isPlainObject( stateStyle.layout )
		) {
			entries.push( [ [ key, 'layout' ], stateStyle.layout ] );
		}
	} );
	return entries;
}

/**
 * Keeps the child layout (such as a grid item's position and span) of a block
 * when it is switched to another block type. The child layout describes the
 * block's place in its parent, not the block itself, but transforms usually
 * build new attributes and drop it.
 *
 * @param {Object}       result  The transformed block.
 * @param {Array|Object} source  Original blocks transformed.
 * @param {number}       index   Index of the transformed block.
 * @param {Array}        results All blocks that resulted from the transformation.
 * @return {Object} Modified transformed block.
 */
export function addTransforms( result, source, index, results ) {
	// `switchToBlockType` passes on a single original block as it got it.
	const sourceBlocks = Array.isArray( source ) ? source : [ source ];

	// A wrapping transform (e.g. a paragraph into a group) keeps the
	// original blocks, child layout included, inside the result.
	if (
		results.length === 1 &&
		result.innerBlocks.length === sourceBlocks.length
	) {
		return result;
	}

	// Only a block that takes the place of exactly one original block can
	// take its child layout.
	if ( results.length !== sourceBlocks.length ) {
		return result;
	}

	let style = result.attributes?.style;
	getChildLayoutEntries( sourceBlocks[ index ]?.attributes?.style ).forEach(
		( [ path, layout ] ) => {
			// A transform that sets a child layout itself knows best.
			if ( getValueFromObjectPath( style, path ) === undefined ) {
				// Setting a path on the style object keeps it an object.
				style = setImmutably( style, path, layout );
			}
		}
	);

	if ( style === result.attributes?.style ) {
		return result;
	}

	return {
		...result,
		attributes: {
			...result.attributes,
			style,
		},
	};
}

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/layout-child/addTransforms',
	addTransforms
);

export default {
	useBlockProps: useBlockPropsChildLayoutStyles,
	edit: ChildLayoutControlsPure,
	attributeKeys: [ 'style' ],
	hasSupport() {
		return true;
	},
};
