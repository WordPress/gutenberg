/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import TextHighlight from './text-highlight';

/**
 * WordPress dependencies
 */
import { safeDecodeURI } from '@wordpress/url';

import {
	Icon,
} from '@wordpress/components';

export const LinkControlSearchItem = ( { itemProps, suggestion, isSelected = false, onClick, isURL = false, searchTerm = '' } ) => {
	return (
		<button
			{ ...itemProps }
			onClick={ onClick }
			className={ classnames( 'block-editor-link-control__search-item', {
				'is-selected': isSelected,
				'is-url': isURL,
				'is-entity': ! isURL,
			} ) }
		>
			{ isURL && (
				<Icon className="block-editor-link-control__search-item-icon" icon="admin-site-alt3" />
			) }
			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					<TextHighlight text={ suggestion.title } highlight={ searchTerm } />
				</span>
				<span className="block-editor-link-control__search-item-info">{ safeDecodeURI( suggestion.url ) || '' }</span>
			</span>
			<span className="block-editor-link-control__search-item-type">{ suggestion.type.toLowerCase() || '' }</span>
		</button>
	);
};

export default LinkControlSearchItem;

