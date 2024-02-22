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
	const {
		selfStretch,
		selfAlign,
		flexSize,
		columnSpan,
		rowSpan,
		height,
		width,
	} = layout;
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

	const isVerticalLayout =
		parentLayout.type === 'constrained' ||
		parentLayout.type === 'default' ||
		parentLayout.type === undefined ||
		orientation === 'vertical';

	let css = '';
	if ( shouldRenderChildLayoutStyles ) {
		// Flex size should still be output for back compat.
		if ( selfStretch === 'fixed' && flexSize ) {
			css = `${ selector } {
				flex-basis: ${ flexSize };
				box-sizing: border-box;
			}`;
			// Grid type styles.
		} else if ( columnSpan ) {
			css = `${ selector } {
				grid-column: span ${ columnSpan };
			}`;
		}
		// All vertical layout types have the same styles.
		if ( isVerticalLayout ) {
			if ( selfAlign === 'fixed' && width ) {
				css += `${ selector } {
					max-width: ${ width };
				}`;
			} else if ( selfAlign === 'fixedNoShrink' && width ) {
				css += `${ selector } {
					width: ${ width };
				}`;
			} else if ( selfAlign === 'fill' ) {
				/**
				 * This style is only needed for flex layouts because
				 * constrained children have alignment set and flow
				 * children are 100% width by default.
				 */
				css += `${ selector } {
					align-self: stretch;
				}`;
			} else if ( selfAlign === 'fit' ) {
				css += `${ selector } {
					width: fit-content;
				}`;
			}

			if ( selfStretch === 'fixed' && height ) {
				// Max-height is needed for flow and constrained children.
				css += `${ selector } {
					max-height: ${ height };
					flex-basis: ${ height };
				}`;
			} else if ( selfStretch === 'fixedNoShrink' && height ) {
				// Height is needed for flow and constrained children.
				css += `${ selector } {
					height: ${ height };
					flex-shrink: 0;
					flex-basis: ${ height };
				}`;
			} else if ( selfStretch === 'fill' ) {
				css += `${ selector } {
					flex-grow: 1;
				}`;
			}
			// Everything else that isn't a grid is a horizontal layout.
		} else if ( parentLayoutType !== 'grid' ) {
			if ( selfStretch === 'fixed' && width ) {
				css += `${ selector } {
					flex-basis: ${ width };
					
				}`;
			} else if ( selfStretch === 'fixedNoShrink' && width ) {
				css += `${ selector } {
					flex-shrink: 0;
					flex-basis: ${ width };
				}`;
			} else if ( selfStretch === 'fill' ) {
				css += `${ selector } {
					flex-grow: 1;
				}`;
			}

			if ( selfAlign === 'fill' ) {
				css += `${ selector } {
					align-self: stretch;
				}`;
			} else if ( selfAlign === 'fixedNoShrink' && height ) {
				css += `${ selector } {
						height: ${ height };
					}`;
			} else if ( selfAlign === 'fixed' && height ) {
				css += `${ selector } {
						max-height: ${ height };
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
