/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, TextHighlight, Icon } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	safeDecodeURI,
} from '@wordpress/url';

const manualLinkEntryTypes = [ 'url', 'mailto', 'tel', 'internal' ];

const InlineSuggestionListItem = forwardRef( ( { id, isSelected, onClick, suggestion, searchTerm }, ref ) => {
	const isURLSuggestion = manualLinkEntryTypes.includes( suggestion.type.toLowerCase() );

	return (
		<Button
			ref={ ref }
			id={ id }
			className={ classnames(
				'block-editor-link-control__search-item',
				{
					'is-selected': isSelected,
					'is-url': isURLSuggestion,
					'is-entity': ! isURLSuggestion,
				}
			) }
			role="option"
			tabIndex="-1"
			aria-selected={ isSelected }
			onClick={ onClick }
		>
			{ isURLSuggestion && (
				<Icon className="block-editor-link-control__search-item-icon" icon="admin-site-alt3" />
			) }
			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					<TextHighlight text={ suggestion.title } highlight={ searchTerm } />
				</span>
				<span aria-hidden={ ! isURLSuggestion } className="block-editor-link-control__search-item-info">
					{ ! isURLSuggestion && ( safeDecodeURI( suggestion.url ) || '' ) }
					{ isURLSuggestion && (
						__( 'Press ENTER to add this link' )
					) }
				</span>
			</span>
			{ suggestion.type && (
				<span className="block-editor-link-control__search-item-type">{ suggestion.type }</span>
			) }
		</Button>
	);
} );

export default InlineSuggestionListItem;

