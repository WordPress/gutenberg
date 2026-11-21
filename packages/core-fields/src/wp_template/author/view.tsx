import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	commentAuthorAvatar as authorIcon,
	layout as themeIcon,
	plugins as pluginIcon,
	globe as globeIcon,
} from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
import type { Template } from './types';
import AuthorAvatar from '../../shared/author/avatar';
import styles from '../../shared/author/style.module.css';

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

/*
 * The author of a template: the avatar of the user, when the site shows
 * avatars, or the site logo, or else an icon of the source (user, theme,
 * plugin, site), next to the author text.
 */
export default function TemplateAuthorView( { item }: { item: Template } ) {
	const originalSource = item.original_source;
	const icon = getIconForSource( originalSource );
	const text = item.author_text;
	const authorId = item.author;

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

	return (
		<Stack direction="row" gap="xs" align="flex-start">
			{ imageUrl && <AuthorAvatar src={ imageUrl } name={ text } /> }
			{ ! imageUrl && (
				<div className={ styles.icon }>
					<Icon icon={ icon } />
				</div>
			) }
			<span className={ styles.name }>{ text }</span>
		</Stack>
	);
}
