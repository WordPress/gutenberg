import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { useStyleOverride } from './utils';
import { useLayout } from '../components/block-list/layout';
import {
	GridVisualizer,
	GridItemResizer,
	GridItemMovers,
	GridItemRotator,
	useUpdateGridChildLayout,
	isGridStackedOnMobile,
	getUnstackedMobileUpdates,
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

export function getChildLayoutStyleRules( {
	selector,
	layout = {},
	viewportOverrides,
	parentLayout = {},
	includeContainerQuery = true,
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

	if ( Object.keys( declarations ).length ) {
		rules.push( { selector, declarations } );
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
} ) {
	return getChildLayoutStyleRules( {
		selector,
		layout,
		parentLayout,
		includeContainerQuery,
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
	}

	let css = '';
	if ( shouldRenderChildLayoutStyles ) {
		css = [
			getChildLayoutStyles( {
				selector,
				layout,
				parentLayout,
			} ),
			getResponsiveChildLayoutStyles( {
				style,
				selector,
				parentLayout,
				viewportSettings,
			} ),
		].join( '' );
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
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockEditingMode,
				getTemplateLock,
				getBlockAttributes,
				getSettings,
				getSelectedBlockStyleState,
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
	const { siblingOrder, siblingStyles } = useSelect(
		( select ) => {
			if ( ! isStackedOnMobile ) {
				return {};
			}
			const { getBlockOrder, getBlockStyles } = unlock(
				select( blockEditorStore )
			);
			const blockOrder = getBlockOrder( rootClientId );
			return {
				siblingOrder: blockOrder,
				siblingStyles: getBlockStyles( blockOrder ),
			};
		},
		[ isStackedOnMobile, rootClientId ]
	);
	const stackedLayouts = useMemo( () => {
		if ( ! isStackedOnMobile || ! siblingOrder ) {
			return null;
		}
		const updates = getUnstackedMobileUpdates( {
			gridClientId: rootClientId,
			gridAttributes: { layout: parentLayout, style: parentStyle },
			children: siblingOrder.map( ( siblingClientId ) => ( {
				clientId: siblingClientId,
				attributes: { style: siblingStyles?.[ siblingClientId ] },
			} ) ),
		} );
		return {
			child: updates[ clientId ]?.style?.[ '@mobile' ]?.layout,
			grid: updates[ rootClientId ]?.style?.[ '@mobile' ]?.layout,
		};
	}, [
		isStackedOnMobile,
		siblingOrder,
		siblingStyles,
		rootClientId,
		clientId,
		parentLayout,
		parentStyle,
	] );
	const updateGridChildLayout = useUpdateGridChildLayout();

	if ( ! isVisible || isParentBlockCurrentlyHidden || isAnyAncestorHidden ) {
		return null;
	}

	const showResizer = allowSizingOnChildren && ! isBlockItselfCurrentlyHidden;
	const isViewportState = hasViewportBlockStyleState( selectedState );
	// The layout the canvas shows for this block and its grid in the
	// selected state.
	const effectiveLayout = stackedLayouts?.child ?? {
		...style?.layout,
		...( isViewportState
			? getStyleForState( style, {
					viewport: selectedState.viewport,
					pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
				} )?.layout
			: undefined ),
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
			{ showRotator && (
				<GridItemRotator
					clientId={ clientId }
					angle={ rotate }
					onPreview={ setPreviewRotate }
					onChange={ updateRotate }
				/>
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

export default {
	useBlockProps: useBlockPropsChildLayoutStyles,
	edit: ChildLayoutControlsPure,
	attributeKeys: [ 'style' ],
	hasSupport() {
		return true;
	},
};
