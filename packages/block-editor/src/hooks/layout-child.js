/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { useStyleOverride } from './utils';
import { useLayout } from '../components/block-list/layout';
import { GridVisualizer, GridItemResizer } from '../components/grid-visualizer';

function useBlockPropsChildLayoutStyles( { style } ) {
	const shouldRenderChildLayoutStyles = useSelect( ( select ) => {
		return ! select( blockEditorStore ).getSettings().disableLayoutStyles;
	} );
	const layout = style?.layout ?? {};
	const { selfStretch, flexSize, columnSpan, rowSpan } = layout;
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
		if ( columnSpan && ( minimumColumnWidth || ! columnCount ) ) {
			// Calculate the container query value.
			const columnSpanNumber = parseInt( columnSpan );
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
				columnSpanNumber * parentColumnValue +
				( columnSpanNumber - 1 ) * defaultGapValue;

			css += `@container (max-width: ${ containerQueryValue }${ parentColumnUnit }) {
				${ selector } {
					grid-column: 1 / -1;
				}
			}`;
		}
		if ( rowSpan ) {
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
	const rootClientId = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlockRootClientId( clientId );
		},
		[ clientId ]
	);
	if ( parentLayout.type !== 'grid' ) {
		return null;
	}
	if ( ! window.__experimentalEnableGridInteractivity ) {
		return null;
	}
	return (
		<>
			<GridVisualizer clientId={ rootClientId } />
			<GridItemResizer
				clientId={ clientId }
				onChange={ ( { columnSpan, rowSpan } ) => {
					setAttributes( {
						style: {
							...style,
							layout: {
								...style?.layout,
								columnSpan,
								rowSpan,
							},
						},
					} );
				} }
			/>
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
