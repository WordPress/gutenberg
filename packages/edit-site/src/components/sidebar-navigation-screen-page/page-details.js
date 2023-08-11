/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { __experimentalTruncate as Truncate } from '@wordpress/components';
import { count as wordCount } from '@wordpress/wordcount';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { safeDecodeURIComponent } from '@wordpress/url';

/**
 * Internal dependencies
 */
import StatusLabel from './status-label';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

// Taken from packages/editor/src/components/time-to-read/index.js.
const AVERAGE_READING_RATE = 189;

function getPageDetails( page ) {
	if ( ! page ) {
		return [];
	}

	const details = [
		{
			label: __( 'Status' ),
			value: (
				<StatusLabel
					status={ page?.password ? 'protected' : page.status }
					date={ page?.date }
					short
				/>
			),
		},
		{
			label: __( 'Slug' ),
			value: (
				<Truncate numberOfLines={ 1 }>
					{ safeDecodeURIComponent( page.slug ) }
				</Truncate>
			),
		},
	];

	if ( page?.templateTitle ) {
		details.push( {
			label: __( 'Template' ),
			value: decodeEntities( page.templateTitle ),
		} );
	}

	if ( page?.parentTitle ) {
		details.push( {
			label: __( 'Parent' ),
			value: decodeEntities( page.parentTitle || __( '(no title)' ) ),
		} );
	}

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );
	const wordsCounted = page?.content?.rendered
		? wordCount( page.content.rendered, wordCountType )
		: 0;
	const readingTime = Math.round( wordsCounted / AVERAGE_READING_RATE );

	if ( wordsCounted && ! page?.isPostsPage ) {
		details.push(
			{
				label: __( 'Words' ),
				value: wordsCounted.toLocaleString() || __( 'Unknown' ),
			},
			{
				label: __( 'Time to read' ),
				value:
					readingTime > 1
						? sprintf(
								/* translators: %s: is the number of minutes. */
								__( '%s mins' ),
								readingTime.toLocaleString()
						  )
						: __( '< 1 min' ),
			}
		);
	}
	return details;
}

export default function PageDetails( { id } ) {
	const { record } = useEntityRecord( 'postType', 'page', id );
	const { parentTitle, templateTitle, isPostsPage } = useSelect(
		( select ) => {
			const { getEditedPostContext } = unlock( select( editSiteStore ) );
			const postContext = getEditedPostContext();
			const templates = select( coreStore ).getEntityRecords(
				'postType',
				'wp_template',
				{ per_page: -1 }
			);
			// Template title.
			const templateSlug =
				// Checks that the post type matches the current theme's post type, otherwise
				// the templateSlug returns 'home'.
				postContext?.postType === 'page'
					? postContext?.templateSlug
					: null;
			const _templateTitle =
				templates && templateSlug
					? templates.find(
							( template ) => template.slug === templateSlug
					  )?.title?.rendered
					: null;

			// Parent page title.
			const _parentTitle = record?.parent
				? select( coreStore ).getEntityRecord(
						'postType',
						'page',
						record.parent,
						{
							_fields: [ 'title' ],
						}
				  )?.title?.rendered
				: null;

			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );

			return {
				parentTitle: _parentTitle,
				templateTitle: _templateTitle,
				isPostsPage: record?.id === siteSettings?.page_for_posts,
			};
		},
		[ record?.parent, record?.id ]
	);
	return (
		<SidebarNavigationScreenDetailsPanel
			spacing={ 5 }
			title={ __( 'Details' ) }
		>
			{ getPageDetails( {
				parentTitle,
				templateTitle,
				isPostsPage,
				...record,
			} ).map( ( { label, value } ) => (
				<SidebarNavigationScreenDetailsPanelRow key={ label }>
					<SidebarNavigationScreenDetailsPanelLabel>
						{ label }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						{ value }
					</SidebarNavigationScreenDetailsPanelValue>
				</SidebarNavigationScreenDetailsPanelRow>
			) ) }
		</SidebarNavigationScreenDetailsPanel>
	);
}
