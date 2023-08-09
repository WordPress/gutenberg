/**
 * WordPress dependencies
 */
import { store as wpStore } from '@wordpress/interactivity';

function toggleAriaLabel( element ) {
	if ( ! ( 'toggledAriaLabel' in element.dataset ) ) {
		throw new Error( 'Element lacks toggledAriaLabel in dataset.' );
	}

	const ariaLabel = element.dataset.toggledAriaLabel;
	element.dataset.toggledAriaLabel = element.ariaLabel;
	element.ariaLabel = ariaLabel;
}

function toggleSearch( { context, ref } ) {
	if ( context.core.search.isSearchCollapsed ) {
		context.core.search.isSearchCollapsed =
			! context.core.search.isSearchCollapsed;
		ref.type = 'submit';
		ref.ariaExpanded = 'true';
		ref.removeAttribute( 'aria-controls' );
		toggleAriaLabel( ref );
		// TODO: Focus on sibling input. (In Chrome seems to make it automatically)
	}
}

wpStore( {
	selectors: {
		core: {
			search: {
				ariaLabel: ( { state, context } ) => {
					const { ariaLabelCollapsed, ariaLabelExpanded } =
						state.core.search;
					return context.core.search.isSearchInputVisible
						? ariaLabelExpanded
						: ariaLabelCollapsed;
				},
			},
		},
	},
	actions: {
		core: {
			search: {
				toggleSearch,
				openSearchInput: ( { context } ) => {
					context.core.search.isSearchInputVisible = true;
				},
			},
		},
	},
} );
