/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem, TextHighlight } from '@wordpress/components';
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
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';

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
	searchTerm,
	onClick,
	isURL = false,
	shouldShowType = false,
} ) => {
	const info = isURL
		? __( 'Press ENTER to add this link' )
		: filterURLForDisplay( safeDecodeURI( suggestion?.url ) );

	return (
		<MenuItem
			{ ...itemProps }
			info={ info }
			iconPosition="left"
			icon={
				<SearchItemIcon suggestion={ suggestion } isURL={ isURL } />
			}
			onClick={ onClick }
			shortcut={ shouldShowType && getVisualTypeName( suggestion ) }
			className="block-editor-link-control__search-item"
		>
			<TextHighlight
				// The component expects a plain text string.
				text={ stripHTML( suggestion.title ) }
				highlight={ searchTerm }
			/>
		</MenuItem>
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
