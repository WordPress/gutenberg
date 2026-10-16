import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	commentAuthorAvatar as authorIcon,
	layout as themeIcon,
	plugins as pluginIcon,
	globe as globeIcon,
} from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- This bundled package already depends on @wordpress/ui.
import { Avatar, Icon, Stack } from '@wordpress/ui';
import type { Template, TemplatePart } from '../../types';

function getIconForSource( originalSource: Template[ 'original_source' ] ) {
	switch ( originalSource ) {
		case 'theme':
			return themeIcon;
		case 'plugin':
			return pluginIcon;
		case 'site':
			return globeIcon;
		default:
			return authorIcon;
	}
}

export default function TemplateAuthorView( {
	item,
}: {
	item: Template | TemplatePart;
} ) {
	const originalSource = item.original_source;
	const icon = getIconForSource( originalSource );
	const text = item.author_text;
	const authorId = item.author;
	const isAuthor = originalSource === 'user' || originalSource === undefined;
	const initials = isAuthor
		? text
				?.trim()
				.split( /\s+/ )
				.slice( 0, 2 )
				.map( ( word ) => Array.from( word )[ 0 ] )
				.join( '' )
				.toUpperCase()
		: undefined;

	const imageUrl = useSelect(
		( select ) => {
			if ( originalSource === 'site' ) {
				const siteData = select( coreStore ).getEntityRecord< {
					site_logo?: number;
				} >( 'root', '__unstableBase' );
				const logoId = siteData?.site_logo;
				if ( ! logoId ) {
					return undefined;
				}
				return select( coreStore ).getEntityRecord< {
					source_url: string;
				} >( 'postType', 'attachment', logoId )?.source_url;
			}

			if ( originalSource !== 'user' || ! authorId ) {
				return undefined;
			}
			return select( coreStore ).getUser( authorId )?.avatar_urls?.[ 48 ];
		},
		[ originalSource, authorId ]
	);

	const hasIconFallback = isAuthor && ! initials;
	const hasStandaloneIcon =
		originalSource === 'theme' || ( hasIconFallback && ! imageUrl );

	return (
		<Stack
			direction="row"
			align="center"
			gap={ hasStandaloneIcon || hasIconFallback ? undefined : 'sm' }
		>
			{ hasStandaloneIcon ? (
				<div
					className="fields-controls__author-icon"
					aria-hidden="true"
				>
					<Icon icon={ icon } />
				</div>
			) : (
				<Avatar.Root
					size="xs"
					aria-hidden="true"
					className={
						hasIconFallback
							? 'fields-controls__author-avatar'
							: undefined
					}
				>
					<Avatar.Fallback
						className={
							hasIconFallback
								? 'fields-controls__author-icon'
								: undefined
						}
					>
						{ isAuthor ? (
							initials || <Icon icon={ authorIcon } />
						) : (
							<Icon
								icon={ icon }
								style={ {
									inlineSize: '100%',
									blockSize: '100%',
								} }
							/>
						) }
					</Avatar.Fallback>
					<Avatar.Image src={ imageUrl } alt="" keepMounted />
				</Avatar.Root>
			) }
			<span className="fields-controls__author-name">{ text }</span>
		</Stack>
	);
}
