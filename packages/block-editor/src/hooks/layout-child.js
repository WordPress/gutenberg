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
	const id = useInstanceId( useBlockPropsChildLayoutStyles );
	const selector = `.wp-container-content-${ id }`;

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
		/**
		 * If minimumColumnWidth is set on the parent, or if no
		 * columnCount is set, the grid is responsive so a
		 * container query is needed for the span to resize.
		 */
		if (
			( columnSpan || columnStart ) &&
			( minimumColumnWidth || ! columnCount )
		) {
			// Check if columnSpan and columnStart are numbers so Math.max doesn't break.
			const columnSpanNumber = columnSpan ? parseInt( columnSpan ) : null;
			const columnStartNumber = columnStart
				? parseInt( columnStart )
				: null;
			const highestNumber = Math.max(
				columnSpanNumber,
				columnStartNumber
			);

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

			const defaultGapValue = parentColumnUnit === 'px' ? 24 : 1.5;
			const containerQueryValue =
				highestNumber * parentColumnValue +
				( highestNumber - 1 ) * defaultGapValue;
			// If a span is set we want to preserve it as long as possible, otherwise we just reset the value.
			const gridColumnValue = columnSpan ? '1/-1' : 'auto';

			css += `@container (max-width: ${ containerQueryValue }${ parentColumnUnit }) {
				${ selector } {
					grid-column: ${ gridColumnValue };
				}
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
		columnCount,
	} = parentLayout;

	const rootClientId = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlockRootClientId( clientId );
		},
		[ clientId ]
	);

	// Use useState() instead of useRef() so that GridItemResizer updates when ref is set.
	const [ resizerBounds, setResizerBounds ] = useState();

	if ( parentLayoutType !== 'grid' ) {
		return null;
	}

	const isManualGrid = !! columnCount;

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
			{ isManualGrid && window.__experimentalEnableGridInteractivity && (
				<GridItemMovers
					layout={ style?.layout }
					parentLayout={ parentLayout }
					onChange={ updateLayout }
					gridClientId={ rootClientId }
					blockClientId={ clientId }
				/>
			) }
			{ isManualGrid && window.__experimentalEnableGridInteractivity && (
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
