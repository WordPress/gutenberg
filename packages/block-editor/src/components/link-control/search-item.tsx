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
import type { ComponentProps } from 'react';
import type {
	LinkControlSearchItemProps,
	LinkControlSuggestion,
} from './types';

const TYPES: Record<
	string,
	{ icon: ComponentProps< typeof Icon >[ 'icon' ]; label: string }
> = {
	post: {
		icon: postList,
		label: __( 'Post' ),
	},
	page: {
		icon: page,
		label: __( 'Page' ),
	},
	post_tag: {
		icon: tag,
		label: __( 'Tag' ),
	},
	category: {
		icon: category,
		label: __( 'Category' ),
	},
	attachment: {
		icon: file,
		label: __( 'Attachment' ),
	},
};

function SearchItemIcon( {
	isURL,
	suggestion,
}: Pick< LinkControlSearchItemProps, 'isURL' | 'suggestion' > ) {
	let icon: ComponentProps< typeof Icon >[ 'icon' ] | null = null;

	// A suggestion added by `transformSuggestions` can bring its own icon.
	if ( suggestion.icon ) {
		icon = suggestion.icon;
	} else if ( isURL ) {
		icon = globe;
		// An absent type is looked up as `'undefined'`, which is not in `TYPES`.
	} else if ( ( suggestion.type as string ) in TYPES ) {
		icon = TYPES[ suggestion.type as string ].icon;
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
 * @param url the url to add a leading slash to.
 * @return the url with a leading slash.
 */
function addLeadingSlash( url: string ): string {
	const trimmedURL = url?.trim();

	if ( ! trimmedURL?.length ) {
		return url;
	}

	return url?.replace( /^\/?/, '/' );
}

function removeTrailingSlash( url: string ): string {
	const trimmedURL = url?.trim();

	if ( ! trimmedURL?.length ) {
		return url;
	}

	return url?.replace( /\/$/, '' );
}

const partialRight =
	< Args extends unknown[], PartialArgs extends unknown[], Return >(
		fn: ( ...args: [ ...Args, ...PartialArgs ] ) => Return,
		...partialArgs: PartialArgs
	) =>
	( ...args: Args ) =>
		fn( ...args, ...partialArgs );

const defaultTo = ( d: string ) => ( v: string | null | undefined ) => {
	return v === null || v === undefined || v !== v ? d : v;
};

/**
 * Prepares a URL for display in the UI.
 * - decodes the URL.
 * - filters it (removes protocol, www, etc.).
 * - truncates it if necessary.
 * - adds a leading slash.
 * @param url the url.
 * @return the processed url to display.
 */
function getURLForDisplay( url: string | undefined ): string | undefined {
	if ( ! url ) {
		return url;
	}

	// `pipe` does not carry the composed return type.
	return pipe(
		safeDecodeURI,
		getPath,
		defaultTo( '' ),
		partialRight< [ string ], [ number ], string >(
			filterURLForDisplay,
			24
		),
		removeTrailingSlash,
		addLeadingSlash
	)( url ) as string;
}

export const LinkControlSearchItem = ( {
	itemProps,
	suggestion,
	searchTerm,
	onClick,
	isURL = false,
	shouldShowType = false,
}: LinkControlSearchItemProps ) => {
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
			// `MenuItem` renders no shortcut for `false`.
			shortcut={
				( shouldShowType && getVisualTypeName( suggestion ) ) as
					string | undefined
			}
			className="block-editor-link-control__search-item"
		>
			<TextHighlight
				// The component expects a plain text string.
				// Search results always carry a title.
				text={ stripHTML( suggestion.title as string ) }
				// Results are shown once a search ran.
				highlight={ searchTerm as string }
			/>
		</MenuItem>
	);
};

function getVisualTypeName( suggestion: LinkControlSuggestion ) {
	if ( suggestion.isFrontPage ) {
		return __( 'Front page' );
	}

	if ( suggestion.isBlogHome ) {
		return __( 'Blog home' );
	}

	// A suggestion added by `transformSuggestions` can bring its own label.
	if ( suggestion.typeLabel ) {
		return suggestion.typeLabel;
	}

	// Provide translated labels for built-in post types. Ideally, the API would return the localised CPT or taxonomy label.
	// An absent type is looked up as `'undefined'`, which is not in `TYPES`.
	if ( ( suggestion.type as string ) in TYPES ) {
		return TYPES[ suggestion.type as string ].label;
	}

	return suggestion.type;
}

export default LinkControlSearchItem;

export const __experimentalLinkControlSearchItem = (
	props: LinkControlSearchItemProps
) => {
	deprecated( 'wp.blockEditor.__experimentalLinkControlSearchItem', {
		since: '6.8',
	} );

	return <LinkControlSearchItem { ...props } />;
};
