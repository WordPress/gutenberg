/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalVStack as VStack,
	ExternalLink,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { pencil } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { escapeAttribute } from '@wordpress/escape-html';
import { safeDecodeURIComponent, filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import PageDetails from './page-details';
import PageActions from '../page-actions';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import HomeTemplateDetails from '../sidebar-navigation-screen-template/home-template-details';

function usePageDetails( postId ) {
	const {
		isPostsPage,
		record,
		featuredMediaSourceUrl,
		featuredMediaAltText,
	} = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const pageRecord = select( coreStore ).getEntityRecord(
				'postType',
				'page',
				postId
			);

			// Featured image.
			const attachedMedia = pageRecord?.featured_media
				? getEntityRecord(
						'postType',
						'attachment',
						pageRecord?.featured_media
				  )
				: null;
			return {
				record: pageRecord,
				isPostsPage:
					parseInt( postId, 10 ) === siteSettings?.page_for_posts,
				featuredMediaSourceUrl:
					attachedMedia?.media_details.sizes?.medium?.source_url ||
					attachedMedia?.source_url,
				featuredMediaAltText: escapeAttribute(
					attachedMedia?.alt_text ||
						attachedMedia?.description?.raw ||
						''
				),
			};
		},
		[ postId ]
	);

	const title = decodeEntities(
		record?.title?.rendered || __( '(no title)' )
	);
	const description = isPostsPage
		? __( 'This page displays your latest posts' )
		: '';

	const featureImageAltText = featuredMediaAltText
		? decodeEntities( featuredMediaAltText )
		: decodeEntities( record?.title?.rendered || __( 'Featured image' ) );

	const content = isPostsPage ? (
		<HomeTemplateDetails />
	) : (
		<>
			{ !! featuredMediaSourceUrl && ! isPostsPage && (
				<VStack
					className="edit-site-sidebar-navigation-screen-page__featured-image-wrapper"
					alignment="left"
					spacing={ 2 }
				>
					<div className="edit-site-sidebar-navigation-screen-page__featured-image has-image">
						<img
							alt={ featureImageAltText }
							src={ featuredMediaSourceUrl }
						/>
					</div>
				</VStack>
			) }
			{ !! record?.excerpt?.rendered && ! isPostsPage && (
				<Truncate
					className="edit-site-sidebar-navigation-screen-page__excerpt"
					numberOfLines={ 3 }
				>
					{ stripHTML( record.excerpt.rendered ) }
				</Truncate>
			) }
			<PageDetails id={ postId } />
		</>
	);

	const meta = record?.link ? (
		<ExternalLink
			className="edit-site-sidebar-navigation-screen__page-link"
			href={ record.link }
		>
			{ filterURLForDisplay( safeDecodeURIComponent( record.link ) ) }
		</ExternalLink>
	) : null;

	const footer = !! record?.modified ? (
		<SidebarNavigationScreenDetailsFooter
			lastModifiedDateTime={ record.modified }
		/>
	) : null;

	return { title, meta, description, content, footer };
}

export default function SidebarNavigationScreenPage() {
	const navigator = useNavigator();
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const {
		params: { postId },
	} = useNavigator();
	const { title, meta, content, description, footer } =
		usePageDetails( postId );

	return (
		<SidebarNavigationScreen
			title={ title }
			description={ description }
			actions={
				<>
					<PageActions
						postId={ postId }
						toggleProps={ { as: SidebarButton } }
						onRemove={ () => {
							navigator.goTo( '/page' );
						} }
					/>
					<SidebarButton
						onClick={ () => setCanvasMode( 'edit' ) }
						label={ __( 'Edit' ) }
						icon={ pencil }
					/>
				</>
			}
			meta={ meta }
			content={ content }
			footer={ footer }
		/>
	);
}
