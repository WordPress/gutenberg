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
	home,
	verse,
} from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { safeDecodeURI, filterURLForDisplay, getPath } from '@wordpress/url';
import { pipe } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

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
		if ( suggestion.type === 'page' ) {
			if ( suggestion.isFrontPage ) {
				icon = home;
			}
			if ( suggestion.isBlogHome ) {
				icon = verse;
			}
		}
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

/**
 * Adds a leading slash to a url if it doesn't already have one.
 * @param {string} url the url to add a leading slash to.
 * @return {string} the url with a leading slash.
 */
function addLeadingSlash( url ) {
	const trimmedURL = url?.trim();

	if ( ! trimmedURL?.length ) {
		return url;
	}

	return url?.replace( /^\/?/, '/' );
}

function removeTrailingSlash( url ) {
	const trimmedURL = url?.trim();

	if ( ! trimmedURL?.length ) {
		return url;
	}

	return url?.replace( /\/$/, '' );
}

const partialRight =
	( fn, ...partialArgs ) =>
	( ...args ) =>
		fn( ...args, ...partialArgs );

const defaultTo = ( d ) => ( v ) => {
	return v === null || v === undefined || v !== v ? d : v;
};

/**
 * Prepares a URL for display in the UI.
 * - decodes the URL.
 * - filters it (removes protocol, www, etc.).
 * - truncates it if necessary.
 * - adds a leading slash.
 * @param {string} url the url.
 * @return {string} the processed url to display.
 */
function getURLForDisplay( url ) {
	if ( ! url ) {
		return url;
	}

	return pipe(
		safeDecodeURI,
		getPath,
		defaultTo( '' ),
		partialRight( filterURLForDisplay, 24 ),
		removeTrailingSlash,
		addLeadingSlash
	)( url );
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
		: getURLForDisplay( suggestion.url );

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

	if ( suggestion.isBlogHome ) {
		return 'blog home';
	}

	// Rename 'post_tag' to 'tag'. Ideally, the API would return the localised CPT or taxonomy label.
	return suggestion.type === 'post_tag' ? 'tag' : suggestion.type;
}

export default LinkControlSearchItem;

export const __experimentalLinkControlSearchItem = ( props ) => {
	deprecated( 'wp.blockEditor.__experimentalLinkControlSearchItem', {
		since: '6.8',
	} );

	return <LinkControlSearchItem { ...props } />;
};
