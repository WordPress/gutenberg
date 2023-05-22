/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
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
import { dateI18n, getDate, getSettings, humanTimeDiff } from '@wordpress/date';
import { count as wordCount } from '@wordpress/wordcount';
import { getMediaDetails } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationSubtitle from '../sidebar-navigation-subtitle';
import SidebarDetails from '../sidebar-navigation-data-list';

// Taken from packages/editor/src/components/time-to-read/index.js.
const AVERAGE_READING_RATE = 189;

function StatusLabel( { status, date } ) {
	const relateToNow = humanTimeDiff( date );
	let statusLabel = '';
	switch ( status ) {
		case 'publish':
			statusLabel = createInterpolateElement(
				sprintf(
					/* translators: %s: is the relative time when the post was published. */
					__( 'Published <time>%s</time>' ),
					relateToNow
				),
				{ time: <time dateTime={ date } /> }
			);
			break;
		case 'future':
			const formattedDate = dateI18n(
				getSettings().formats.date,
				getDate( date )
			);
			statusLabel = createInterpolateElement(
				sprintf(
					/* translators: %s: is the formatted date and time on which the post is scheduled to be published. */
					__( 'Scheduled for <time>%s</time>' ),
					formattedDate
				),
				{ time: <time dateTime={ date } /> }
			);
			break;
		case 'draft':
			statusLabel = __( 'Draft' );
			break;
		case 'pending':
			statusLabel = __( 'Pending' );
			break;
		default:
			statusLabel = __( 'Unknown' );
			break;
	}

	return (
		<HStack
			alignment="left"
			spacing={ 2 }
			className="edit-site-sidebar-navigation-screen-page__status"
		>
			<div
				className={ classnames(
					'edit-site-sidebar-navigation-screen-page__status-indicator',
					{
						[ `has-status has-${ status }-status` ]: !! status,
					}
				) }
				aria-hidden="true"
			/>
			<Text>{ statusLabel }</Text>
		</HStack>
	);
}

function getPageDetails( page ) {
	if ( ! page ) {
		return [];
	}
	const details = [];

	if ( page?.status ) {
		details.push( {
			label: 'Status',
			value: <StatusLabel status={ page.status } date={ page?.date } />,
		} );
	}

	if ( page?.slug ) {
		details.push( {
			label: 'Slug',
			value: <Truncate numberOfLines={ 1 }>{ page.slug }</Truncate>,
		} );
	}

	if ( page?.templateTitle ) {
		details.push( {
			label: 'Template',
			value: page.templateTitle,
		} );
	}

	details.push( {
		label: 'Parent',
		value: page?.parentTitle,
	} );

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );
	const wordsCounted = page?.content?.raw
		? wordCount( page.content.raw, wordCountType )
		: 0;
	const readingTime = Math.round( wordsCounted / AVERAGE_READING_RATE );

	if ( wordsCounted ) {
		details.push(
			{
				label: 'Words',
				value: wordsCounted.toLocaleString() || __( 'Unknown' ),
			},
			{
				label: 'Time to read',
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

export default function SidebarNavigationScreenPage() {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const {
		params: { postId },
	} = useNavigator();
	const { record } = useEntityRecord( 'postType', 'page', postId );
	/*
	 * Only custom template slugs are available in the post entity record
	 * Pages using theme templates will not have a template slug.
	 */
	const { records: templates, isResolving: areTemplatesLoading } =
		useEntityRecords( 'postType', 'wp_template', {
			per_page: -1,
		} );
	const templateTitle = areTemplatesLoading
		? ''
		: templates?.find( ( template ) => template?.slug === record?.template )
				?.title?.rendered || '';

	const {
		parentTitle,
		featuredMediaDetails: { mediaSourceUrl, mediaDescription },
	} = useSelect(
		( select ) => {
			// Featured image.
			const attachedMedia = record?.featured_media
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						record?.featured_media
				  )
				: null;

			// Parent page title.
			const parent = record?.parent
				? select( coreStore ).getEntityRecord(
						'postType',
						'page',
						record.parent
				  )
				: null;
			let _parentTitle = __( 'Top level' );
			if ( parent ) {
				_parentTitle = parent?.title?.rendered
					? decodeEntities( parent.title.rendered )
					: __( 'Untitled' );
			}

			return {
				parentTitle: _parentTitle,
				featuredMediaDetails: {
					...getMediaDetails( attachedMedia, postId ),
					mediaDescription: attachedMedia?.description?.raw,
				},
			};
		},
		[ record ]
	);
	const displayLink = record?.link
		? record.link.replace( /^(https?:\/\/)?/, '' )
		: null;

	return (
		<SidebarNavigationScreen
			className="edit-site-sidebar-navigation-screen-page"
			title={
				record
					? decodeEntities( record?.title?.rendered )
					: __( 'Untitled' )
			}
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			meta={
				!! record?.link && (
					<ExternalLink
						className="edit-site-sidebar-navigation-screen__page-link"
						href={ record.link }
					>
						{ displayLink }
					</ExternalLink>
				)
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
							style={
								!! mediaSourceUrl
									? {
											backgroundImage: `url(${ mediaSourceUrl })`,
									  }
									: {}
							}
						>
							{ record && ! record?.featured_media && (
								<p>{ __( 'No featured image' ) }</p>
							) }
						</div>
						{ mediaSourceUrl && mediaDescription && (
							<Truncate
								className="edit-site-sidebar-navigation-screen-page__featured-image-description"
								numberOfLines={ 1 }
							>
								{ decodeEntities( mediaDescription ) }
							</Truncate>
						) }
					</VStack>
					{ !! record?.excerpt?.raw && (
						<Truncate
							className="edit-site-sidebar-navigation-screen-page__excerpt"
							numberOfLines={ 3 }
						>
							{ decodeEntities( record?.excerpt?.raw ) }
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
					{ !! record && (
						<VStack className="edit-site-sidebar-navigation-screen__sticky-section">
							<Text>
								{ createInterpolateElement(
									sprintf(
										/* translators: %s: is the relative time when the post was last modified. */
										__( 'Last modified <time>%s</time>' ),
										humanTimeDiff( record.modified )
									),
									{
										time: (
											<time
												dateTime={ record.modified }
											/>
										),
									}
								) }
							</Text>
						</VStack>
					) }
				</>
			}
		/>
	);
}
