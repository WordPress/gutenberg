/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	commentAuthorAvatar as authorIcon,
	layout as themeIcon,
	plugins as pluginIcon,
	globe as globeIcon,
} from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
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
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
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
		<Stack direction="row" align="center">
			{ imageUrl && (
				<div
					className={ clsx( 'fields-controls__author-avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="fields-controls__author-icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span className="fields-controls__author-name">{ text }</span>
		</Stack>
	);
}
