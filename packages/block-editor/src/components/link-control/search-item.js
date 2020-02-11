/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { safeDecodeURI } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { Button, Icon, TextHighlight } from '@wordpress/components';

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
			{ isURL && (
				<Icon
					className="block-editor-link-control__search-item-icon"
					icon="admin-site-alt3"
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
					{ ! isURL && ( safeDecodeURI( suggestion.url ) || '' ) }
					{ isURL && __( 'Press ENTER to add this link' ) }
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
