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
import { Icon, globe } from '@wordpress/icons';

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
			{ isURL && (
				<Icon
					className="block-editor-link-control__search-item-icon"
					icon={ globe }
				/>
			) }

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
					{ isURL && __( 'Press ENTER to add this link' ) }
				</span>
			</span>
			{ shouldShowType && suggestion.type && (
				<span className="block-editor-link-control__search-item-type">
					{ getVisualTypeName( suggestion ) }
				</span>
			) }
		</Button>
	);
};

function getVisualTypeName( suggestion ) {
	if ( suggestion.isFrontPage ) {
		return 'front page';
	}

	// Rename 'post_tag' to 'tag'. Ideally, the API would return the localised CPT or taxonomy label.
	return suggestion.type === 'post_tag' ? 'tag' : suggestion.type;
}

export default LinkControlSearchItem;
