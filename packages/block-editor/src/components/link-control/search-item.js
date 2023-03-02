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
import {
	Icon,
	globe,
	page,
	tag,
	postList,
	category,
	file,
} from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

const ICONS_MAP = {
	post: postList,
	page,
	post_tag: tag,
	category,
	attachment: file,
};

function SearchItemIcon( { isURL, suggestion } ) {
	let icon = null;

	if ( isURL ) {
		icon = globe;
	} else if ( suggestion.type in ICONS_MAP ) {
		icon = ICONS_MAP[ suggestion.type ];
	}

	if ( icon ) {
		return (
			<Icon
				className="block-editor-link-control__search-item-icon"
				icon={ icon }
			/>
		);
	}

	return null;
}

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
			<SearchItemIcon suggestion={ suggestion } isURL={ isURL } />

			<span className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					<TextHighlight
						// The component expects a plain text string.
						text={ stripHTML( suggestion.title ) }
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
