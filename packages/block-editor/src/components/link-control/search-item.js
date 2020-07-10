/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { Button, TextHighlight } from '@wordpress/components';

export const LinkControlSearchItem = ( {
	itemProps,
	suggestion,
	isSelected = false,
	onClick,
	isURL = false,
	searchTerm = '',
} ) => {
	return (
		<Button
			{ ...itemProps }
			onClick={ onClick }
			className={ classnames( 'block-editor-link-control__search-item', {
				'is-selected': isSelected,
				'is-url': isURL,
				'is-entity': ! isURL,
			} ) }
		>
			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					<TextHighlight
						text={ suggestion.title }
						highlight={ searchTerm }
					/>
				</span>
				<span
					aria-hidden={ ! isURL }
					className="block-editor-link-control__search-item-info"
				>
					{ ! isURL &&
						( filterURLForDisplay(
							safeDecodeURI( suggestion.url )
						) ||
							'' ) }
					{ isURL && __( 'Add a link to this URL' ) }
				</span>
			</span>
			{ suggestion.type && (
				<span className="block-editor-link-control__search-item-type">
					{ suggestion.type }
				</span>
			) }
		</Button>
	);
};

export default LinkControlSearchItem;
