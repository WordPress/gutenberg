/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalVStack as VStack,
	ExternalLink,
	__experimentalTruncate as Truncate,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { pencil } from '@wordpress/icons';
import { humanTimeDiff } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { escapeAttribute } from '@wordpress/escape-html';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationSubtitle from '../sidebar-navigation-subtitle';
import PageDetails from './page-details';

export default function SidebarNavigationScreenPage() {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const {
		params: { postId },
	} = useNavigator();
	const { record } = useEntityRecord( 'postType', 'page', postId );

	const {
		featuredMediaDetails: { sourceUrl, altText },
	} = useSelect(
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
				featuredMediaDetails: {
					sourceUrl:
						attachedMedia?.media_details.sizes?.medium
							?.source_url || attachedMedia?.source_url,
					altText: escapeAttribute(
						attachedMedia?.alt_text ||
							attachedMedia?.description?.raw ||
							''
					),
				},
			};
		},
		[ record ]
	);

	const featureImageAltText = altText
		? decodeEntities( altText )
		: decodeEntities( record?.title?.rendered || __( 'Featured image' ) );

	return record ? (
		<SidebarNavigationScreen
			title={ decodeEntities(
				record?.title?.rendered || __( '(no title)' )
			) }
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			meta={
				<ExternalLink
					className="edit-site-sidebar-navigation-screen__page-link"
					href={ record.link }
				>
					{ record.link.replace( /^(https?:\/\/)?/, '' ) }
				</ExternalLink>
			}
			content={
				<>
					<VStack
						className="edit-site-sidebar-navigation-screen-page__featured-image-wrapper"
						alignment="left"
						spacing={ 2 }
					>
						<div
							className={ classnames(
								'edit-site-sidebar-navigation-screen-page__featured-image',
								{
									'has-image': !! sourceUrl,
								}
							) }
						>
							{ !! sourceUrl && (
								<img
									alt={ featureImageAltText }
									src={ sourceUrl }
								/>
							) }
							{ ! record?.featured_media && (
								<p>{ __( 'No featured image' ) }</p>
							) }
						</div>
					</VStack>
					{ !! record?.excerpt?.rendered && (
						<Truncate
							className="edit-site-sidebar-navigation-screen-page__excerpt"
							numberOfLines={ 3 }
						>
							{ stripHTML( record.excerpt.rendered ) }
						</Truncate>
					) }
					<SidebarNavigationSubtitle>
						{ __( 'Details' ) }
					</SidebarNavigationSubtitle>
					<PageDetails id={ postId } />
				</>
			}
			footer={
				!! record?.modified && (
					<HStack
						spacing={ 5 }
						alignment="left"
						className="edit-site-sidebar-navigation-screen-page__details"
					>
						<Text className="edit-site-sidebar-navigation-screen-page__details-label">
							{ __( 'Last modified' ) }
						</Text>
						<Text className="edit-site-sidebar-navigation-screen-page__details-value">
							{ createInterpolateElement(
								sprintf(
									/* translators: %s: is the relative time when the post was last modified. */
									__( '<time>%s</time>' ),
									humanTimeDiff( record.modified )
								),
								{
									time: <time dateTime={ record.modified } />,
								}
							) }
						</Text>
					</HStack>
				)
			}
		/>
	) : null;
}
