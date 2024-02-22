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
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { pencil } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { escapeAttribute } from '@wordpress/escape-html';
import { safeDecodeURIComponent, filterURLForDisplay } from '@wordpress/url';
import { useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

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

const { useHistory } = unlock( routerPrivateApis );

export default function SidebarNavigationScreenPage( { backPath } ) {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const history = useHistory();
	const {
		params: { postId },
		goTo,
	} = useNavigator();
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'page',
		postId
	);

	const { featuredMediaAltText, featuredMediaSourceUrl } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			// Featured image.
			const attachedMedia = record?.featured_media
				? getEntityRecord(
						'postType',
						'attachment',
						record?.featured_media
				  )
				: null;

			return {
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
		[ record ]
	);

	// Redirect to the main pages navigation screen if the page is not found or has been deleted.
	useEffect( () => {
		if ( hasResolved && ! record ) {
			history.push( {
				path: '/page',
				postId: undefined,
				postType: undefined,
				canvas: 'view',
			} );
		}
	}, [ hasResolved, history ] );

	const featureImageAltText = featuredMediaAltText
		? decodeEntities( featuredMediaAltText )
		: decodeEntities( record?.title?.rendered || __( 'Featured image' ) );

	return record ? (
		<SidebarNavigationScreen
			backPath={ backPath }
			title={ decodeEntities(
				record?.title?.rendered || __( '(no title)' )
			) }
			actions={
				<>
					<SidebarButton
						onClick={ () => setCanvasMode( 'edit' ) }
						label={ __( 'Edit' ) }
						icon={ pencil }
					/>
					<PageActions
						postId={ postId }
						toggleProps={ { as: SidebarButton } }
						onRemove={ () => {
							goTo( '/page' );
						} }
					/>
				</>
			}
			meta={
				<ExternalLink
					className="edit-site-sidebar-navigation-screen__page-link"
					href={ record.link }
				>
					{ filterURLForDisplay(
						safeDecodeURIComponent( record.link )
					) }
				</ExternalLink>
			}
			content={
				<>
					{ !! featuredMediaSourceUrl && (
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
					{ !! record?.excerpt?.rendered && (
						<Truncate
							className="edit-site-sidebar-navigation-screen-page__excerpt"
							numberOfLines={ 3 }
						>
							{ stripHTML( record.excerpt.rendered ) }
						</Truncate>
					) }
					<PageDetails id={ postId } />
				</>
			}
			footer={
				record?.modified ? (
					<SidebarNavigationScreenDetailsFooter record={ record } />
				) : null
			}
		/>
	) : null;
}
