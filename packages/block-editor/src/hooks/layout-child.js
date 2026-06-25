/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { useStyleOverride } from './utils';
import { useLayout } from '../components/block-list/layout';
import {
	GridVisualizer,
	GridItemResizer,
	GridItemMovers,
} from '../components/grid';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import useBlockVisibility from '../components/block-visibility/use-block-visibility';
import { deviceTypeKey } from '../store/private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../components/block-visibility/constants';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
} from './block-style-state';

// Used for generating the instance ID
const LAYOUT_CHILD_BLOCK_PROPS_REFERENCE = {};
// Keep in sync with WP_Theme_JSON_Gutenberg::RESPONSIVE_BREAKPOINTS.
const RESPONSIVE_BREAKPOINTS = {
	'@mobile': '@media (width <= 480px)',
	'@tablet': '@media (480px < width <= 782px)',
};

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
	const { columnCount, minimumColumnWidth } = parentLayout;
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
			declarations[
				'grid-column'
			] = `${ columnStart } / span ${ columnSpan }`;
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
} ) {
	const baseLayout = style?.layout ?? {};

	return Object.entries( RESPONSIVE_BREAKPOINTS )
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

function useBlockPropsChildLayoutStyles( { style } ) {
	const shouldRenderChildLayoutStyles = useSelect( ( select ) => {
		return ! select( blockEditorStore ).getSettings().disableLayoutStyles;
	} );
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

function ChildLayoutControlsPure( { clientId, style, setAttributes } ) {
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
			style={ style }
			setAttributes={ setAttributes }
			allowSizingOnChildren={ allowSizingOnChildren }
			isManualPlacement={ isManualPlacement }
			parentLayout={ parentLayout }
		/>
	);
}

function GridTools( {
	clientId,
	style,
	setAttributes,
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
		isChildBlockAGrid,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockEditingMode,
				getTemplateLock,
				getBlockAttributes,
				getSettings,
			} = select( blockEditorStore );

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
				// Check if the selected child block is itself a grid.
				isChildBlockAGrid: blockAttributes?.layout?.type === 'grid',
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
		} );

	// Use useState() instead of useRef() so that GridItemResizer updates when ref is set.
	const [ resizerBounds, setResizerBounds ] = useState();

	const childGridClientId = isChildBlockAGrid ? clientId : undefined;

	if ( ! isVisible || isParentBlockCurrentlyHidden || isAnyAncestorHidden ) {
		return null;
	}

	const showResizer = allowSizingOnChildren && ! isBlockItselfCurrentlyHidden;

	function updateLayout( layout ) {
		setAttributes( {
			style: {
				...style,
				layout: {
					...style?.layout,
					...layout,
				},
			},
		} );
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
				/>
			) }
			{ isManualPlacement &&
				window.__experimentalEnableGridInteractivity && (
					<GridItemMovers
						layout={ style?.layout }
						parentLayout={ parentLayout }
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
