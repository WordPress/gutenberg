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
	const { selfStretch, flexSize, columnSpan, rowSpan, height, width } =
		layout;
	const parentLayout = useLayout() || {};
	const {
		columnCount,
		minimumColumnWidth,
		orientation,
		type: parentType,
		default: { type: defaultParentType = 'default' } = {},
	} = parentLayout;
	const parentLayoutType = parentType || defaultParentType;
	const id = useInstanceId( useBlockPropsChildLayoutStyles );
	const selector = `.wp-container-content-${ id }`;

	const isFlowOrConstrained =
		parentLayout.type === 'constrained' ||
		parentLayout.type === 'default' ||
		parentLayout.type === undefined;

	const widthProp =
		isFlowOrConstrained || orientation === 'vertical'
			? 'selfAlign'
			: 'selfStretch';
	const heightProp =
		isFlowOrConstrained || orientation === 'vertical'
			? 'selfStretch'
			: 'selfAlign';

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
		if ( isFlowOrConstrained || orientation === 'vertical' ) {
			// set width
			if ( layout[ widthProp ] === 'fixed' && width ) {
				css += `${ selector } {
					max-width: ${ width };
				}`;
			} else if ( layout[ widthProp ] === 'fixedNoShrink' && width ) {
				css += `${ selector } {
					width: ${ width };
				}`;
			} else if ( layout[ widthProp ] === 'fill' ) {
				css += `${ selector } {
					align-self: stretch;
				}`;
			} else if ( layout[ widthProp ] === 'fit' ) {
				css += `${ selector } {
					width: fit-content;
				}`;
			}

			// set height
			if ( layout[ heightProp ] === 'fixed' && height ) {
				css += `${ selector } {
					max-height: ${ height };
					flex-grow: 0;
					flex-shrink: 1;
					flex-basis: ${ height };
				}`;
			} else if ( layout[ heightProp ] === 'fixedNoShrink' && height ) {
				css += `${ selector } {
					height: ${ height };
					flex-shrink: 0;
					flex-grow: 0;
					flex-basis: auto;
				}`;
			} else if ( layout[ heightProp ] === 'fill' ) {
				css += `${ selector } {
					flex-grow: 1;
					flex-shrink: 1;
				}`;
			} else if ( layout[ heightProp ] === 'fit' ) {
				css += `${ selector } {
					flex-grow: 0;
					flex-shrink: 0;
					flex-basis: auto;
					height: auto;
				}`;
			}
		} else if ( parentLayoutType !== 'grid' ) {
			// set width
			if ( layout[ widthProp ] === 'fixed' && width ) {
				css += `${ selector } {
					max-width: ${ width };
					flex-grow: 0;
					flex-shrink: 1;
					flex-basis: ${ width };
					
				}`;
			} else if ( layout[ widthProp ] === 'fixedNoShrink' && width ) {
				css += `${ selector } {
					width: ${ width };
					flex-shrink: 0;
					flex-grow: 0;
					flex-basis: auto;
				}`;
			} else if ( layout[ widthProp ] === 'fill' ) {
				css += `${ selector } {
					flex-grow: 1;
					flex-shrink: 1;
					flex-basis: 100%;
				}`;
			} else if ( layout[ widthProp ] === 'fit' ) {
				css += `${ selector } {
					flex-grow: 0;
					flex-shrink: 0;
					flex-basis: auto;
					width: fit-content;
				}`;
			}

			// set height
			if ( layout[ heightProp ] === 'fill' ) {
				css += `${ selector } {
					align-self: stretch;
				}`;
			} else if ( layout[ heightProp ] === 'fit' ) {
				css += `${ selector } {
						height: fit-content;
					}`;
			} else if ( layout[ heightProp ] === 'fixedNoShrink' ) {
				css += `${ selector } {
						height: ${ height };
					}`;
			}
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
