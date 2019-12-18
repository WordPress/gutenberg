/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const URLInputInlineSuggestionList = forwardRef( ( { id, children, isFetchingSuggestions }, ref ) => {
	const resultsListClasses = classnames( 'block-editor-link-control__search-results', {
		'is-loading': isFetchingSuggestions,
	} );

	return (
		<div className="block-editor-link-control__search-results-wrapper">
			<div
				ref={ ref }
				id={ id }
				className={ resultsListClasses }
				role="listbox"
			>
				{ children }
			</div>
		</div>
	);
} );

export default URLInputInlineSuggestionList;

