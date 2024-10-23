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
import { useStyleOverride } from './utils';
import { useLayout } from '../components/block-list/layout';
import {
	GridVisualizer,
	GridItemResizer,
	GridItemMovers,
} from '../components/grid';

// Used for generating the instance ID
const LAYOUT_CHILD_BLOCK_PROPS_REFERENCE = {};

function useBlockPropsChildLayoutStyles( { style } ) {
	const shouldRenderChildLayoutStyles = useSelect( ( select ) => {
		return ! select( blockEditorStore ).getSettings().disableLayoutStyles;
	} );
	const layout = style?.layout ?? {};
	const {
		selfStretch,
		flexSize,
		columnStart,
		rowStart,
		columnSpan,
		rowSpan,
	} = layout;
	const parentLayout = useLayout() || {};
	const { columnCount, minimumColumnWidth } = parentLayout;
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
		if ( selfStretch === 'fixed' && flexSize ) {
			css = `${ selector } {
				flex-basis: ${ flexSize };
				box-sizing: border-box;
			}`;
		} else if ( selfStretch === 'fill' ) {
			css = `${ selector } {
				flex-grow: 1;
			}`;
		} else if ( columnStart && columnSpan ) {
			css = `${ selector } {
				grid-column: ${ columnStart } / span ${ columnSpan };
			}`;
		} else if ( columnStart ) {
			css = `${ selector } {
				grid-column: ${ columnStart };
			}`;
		} else if ( columnSpan ) {
			css = `${ selector } {
				grid-column: span ${ columnSpan };
			}`;
		}
		if ( rowStart && rowSpan ) {
			css += `${ selector } {
				grid-row: ${ rowStart } / span ${ rowSpan };
			}`;
		} else if ( rowStart ) {
			css += `${ selector } {
				grid-row: ${ rowStart };
			}`;
		} else if ( rowSpan ) {
			css += `${ selector } {
				grid-row: span ${ rowSpan };
			}`;
		}
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

			css += `@container (max-width: ${ Math.max(
				containerQueryValue,
				minimumContainerQueryValue
			) }${ parentColumnUnit }) {
				${ selector } {
					grid-column: ${ gridColumnValue };
					grid-row: auto;
				}
			}`;
		}
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
	const { rootClientId, isVisible } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockEditingMode,
				getTemplateLock,
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

			return {
				rootClientId: _rootClientId,
				isVisible: true,
			};
		},
		[ clientId ]
	);

	// Use useState() instead of useRef() so that GridItemResizer updates when ref is set.
	const [ resizerBounds, setResizerBounds ] = useState();

	if ( ! isVisible ) {
		return null;
	}

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
			/>
			{ allowSizingOnChildren && (
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
