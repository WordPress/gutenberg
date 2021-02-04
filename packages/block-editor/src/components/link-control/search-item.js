/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { Button, TextHighlight } from '@wordpress/components';

export const LinkControlSearchItem = ( {
	itemProps,
	suggestion,
	isSelected = false,
	onClick,
	isURL = false,
	searchTerm = '',
	shouldShowType = false,
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
					className="block-editor-link-control__search-item-info"
				>
					{ filterURLForDisplay( safeDecodeURI( suggestion.url ) ) }
				</span>
			</span>
			{ shouldShowType && suggestion.type && (
				<span className="block-editor-link-control__search-item-type">
					{ /* Rename 'post_tag' to 'tag'. Ideally, the API would return the localised CPT or taxonomy label. */ }
					{ suggestion.type === 'post_tag' ? 'tag' : suggestion.type }
				</span>
			) }
		</Button>
	);
};

export default LinkControlSearchItem;
