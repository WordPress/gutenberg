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

function useBlockPropsChildLayoutStyles( { style } ) {
	const shouldRenderChildLayoutStyles = useSelect( ( select ) => {
		return ! select( blockEditorStore ).getSettings().disableLayoutStyles;
	} );
	const layout = style?.layout ?? {};
	const { height, width } = layout;
	const parentLayout = useLayout() || {};
	const { orientation } = parentLayout;

	const id = useInstanceId( useBlockPropsChildLayoutStyles );
	const selector = `.wp-container-content-${ id }`;

	const isConstrained =
		parentLayout.type === 'constrained' ||
		parentLayout.type === 'default' ||
		parentLayout.type === undefined;

	const widthProp =
		isConstrained || orientation === 'vertical'
			? 'selfAlign'
			: 'selfStretch';
	const heightProp =
		isConstrained || orientation === 'vertical'
			? 'selfStretch'
			: 'selfAlign';

	let css = '';
	if ( shouldRenderChildLayoutStyles ) {
		if ( isConstrained || orientation === 'vertical' ) {
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
		} else {
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
	}

	useStyleOverride( { css } );

	// Only attach a container class if there is generated CSS to be attached.
	if ( ! css ) {
		return;
	}

	// Attach a `wp-container-content` id-based classname.
	return { className: `wp-container-content-${ id }` };
}

export default {
	useBlockProps: useBlockPropsChildLayoutStyles,
	attributeKeys: [ 'style' ],
	hasSupport() {
		return true;
	},
};
