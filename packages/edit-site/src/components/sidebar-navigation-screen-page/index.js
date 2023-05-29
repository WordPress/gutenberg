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
} from '@wordpress/components';
import {
	store as coreStore,
	useEntityRecord,
	useEntityRecords,
} from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { pencil } from '@wordpress/icons';
import { humanTimeDiff } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { privateApis as privateEditorApis } from '@wordpress/editor';
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
import SidebarDetails from '../sidebar-navigation-data-list';
import DataListItem from '../sidebar-navigation-data-list/data-list-item';
import getPageDetails from './get-page-details';

export default function SidebarNavigationScreenPage() {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { getFeaturedMediaDetails } = unlock( privateEditorApis );
	const {
		params: { postId },
	} = useNavigator();
	const { record } = useEntityRecord( 'postType', 'page', postId );

	const {
		parentTitle,
		featuredMediaDetails: { mediaSourceUrl, altText },
		templateSlug,
	} = useSelect(
		( select ) => {
			const { getEditedPostContext } = unlock( select( editSiteStore ) );

			// Featured image.
			const attachedMedia = record?.featured_media
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						record?.featured_media
				  )
				: null;

			// Parent page title.
			let _parentTitle = record?.parent
				? select( coreStore ).getEntityRecord(
						'postType',
						'page',
						record.parent,
						{ _fields: [ 'title' ] }
				  )
				: null;

			if ( _parentTitle?.title ) {
				_parentTitle = _parentTitle.title?.rendered
					? decodeEntities( _parentTitle.title.rendered )
					: __( 'Untitled' );
			} else {
				_parentTitle = __( 'Top level' );
			}

			return {
				parentTitle: _parentTitle,
				templateSlug: getEditedPostContext()?.templateSlug,
				featuredMediaDetails: {
					...getFeaturedMediaDetails( attachedMedia, postId ),
					altText: escapeAttribute(
						attachedMedia?.alt_text ||
							attachedMedia?.description?.raw ||
							''
					),
				},
			};
		},
		[ record, postId ]
	);

	// Match template slug to template title.
	const { records: templates, isResolving: areTemplatesLoading } =
		useEntityRecords( 'postType', 'wp_template', {
			per_page: -1,
		} );
	const templateTitle =
		! areTemplatesLoading && templateSlug
			? templates?.find( ( template ) => template?.slug === templateSlug )
					?.title?.rendered || templateSlug
			: '';

	return record ? (
		<SidebarNavigationScreen
			title={ decodeEntities( record?.title?.rendered ) }
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
									'has-image': !! mediaSourceUrl,
								}
							) }
						>
							{ !! mediaSourceUrl && (
								<img
									alt={
										altText
											? decodeEntities( altText )
											: decodeEntities(
													record.title?.rendered
											  ) || __( 'Featured image' )
									}
									src={ mediaSourceUrl }
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
						Details
					</SidebarNavigationSubtitle>
					<SidebarDetails
						details={ getPageDetails( {
							parentTitle,
							templateTitle,
							...record,
						} ) }
					/>
				</>
			}
			footer={
				<DataListItem
					label={ __( 'Last modified' ) }
					value={ createInterpolateElement(
						sprintf(
							/* translators: %s: is the relative time when the post was last modified. */
							__( '<time>%s</time>' ),
							humanTimeDiff( record.modified )
						),
						{
							time: <time dateTime={ record.modified } />,
						}
					) }
				/>
			}
		/>
	) : null;
}
