/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	ExternalLink,
	Button,
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
import Page from '../page';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import PageDetails from './page-details';
import PageActions from '../page-actions';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export default function PageSingle() {
	const history = useHistory();
	const { params } = useLocation();
	const { postId } = params ?? {};
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'page',
		postId
	);
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { goTo } = useNavigator();

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
		<Page
			title={ decodeEntities(
				record?.title?.rendered || __( '(no title)' )
			) }
			subTitle={
				<ExternalLink href={ record.link }>
					{ filterURLForDisplay(
						safeDecodeURIComponent( record.link )
					) }
				</ExternalLink>
			}
			backPath={ '/page' }
			actions={
				<HStack spacing={ 0 }>
					<PageActions
						postId={ postId }
						toggleProps={ { as: Button } }
						onRemove={ () => {
							goTo( '/page' );
						} }
					/>
					<Button
						onClick={ () => setCanvasMode( 'edit' ) }
						label={ __( 'Edit' ) }
						icon={ pencil }
					/>
				</HStack>
			}
		>
			<VStack spacing={ 7 } className="page-main-content">
				{ !! featuredMediaSourceUrl && (
					<VStack
						alignment="left"
						spacing={ 5 }
						className="page-main-content__featured"
					>
						<Heading level={ 6 } upperCase variant="muted">
							Featured image
						</Heading>
						<img
							alt={ featureImageAltText }
							src={ featuredMediaSourceUrl }
						/>
					</VStack>
				) }
				{ !! record?.excerpt?.rendered && (
					<Truncate numberOfLines={ 3 }>
						{ stripHTML( record.excerpt.rendered ) }
					</Truncate>
				) }
				<PageDetails id={ postId } />
			</VStack>
		</Page>
	) : null;
}
