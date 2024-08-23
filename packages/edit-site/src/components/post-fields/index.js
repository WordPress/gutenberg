/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import {
	createInterpolateElement,
	useMemo,
	useState,
	useCallback,
} from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import {
	trash,
	drafts,
	published,
	scheduled,
	pending,
	notAllowed,
	commentAuthorAvatar as authorIcon,
	lineSolid,
} from '@wordpress/icons';
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalGrid as Grid,
	Icon,
	Button,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
	OPERATOR_IS_ANY,
} from '../../utils/constants';
import { default as Link, useLink } from '../routes/link';
import Media from '../media';
import { MediaUpload } from '@wordpress/block-editor';

// See https://github.com/WordPress/gutenberg/issues/55886
// We do not support custom statutes at the moment.
const STATUSES = [
	{
		value: 'draft',
		label: __( 'Draft' ),
		icon: drafts,
		description: __( 'Not ready to publish.' ),
	},
	{
		value: 'future',
		label: __( 'Scheduled' ),
		icon: scheduled,
		description: __( 'Publish automatically on a chosen date.' ),
	},
	{
		value: 'pending',
		label: __( 'Pending Review' ),
		icon: pending,
		description: __( 'Waiting for review before publishing.' ),
	},
	{
		value: 'private',
		label: __( 'Private' ),
		icon: notAllowed,
		description: __( 'Only visible to site admins and editors.' ),
	},
	{
		value: 'publish',
		label: __( 'Published' ),
		icon: published,
		description: __( 'Visible to everyone.' ),
	},
	{ value: 'trash', label: __( 'Trash' ), icon: trash },
];

const getFormattedDate = ( dateToDisplay ) =>
	dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( dateToDisplay )
	);

function PostStatusField( { item } ) {
	const status = STATUSES.find( ( { value } ) => value === item.status );
	const label = status?.label || item.status;
	const icon = status?.icon;
	return (
		<HStack alignment="left" spacing={ 0 }>
			{ icon && (
				<div className="edit-site-post-list__status-icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span>{ label }</span>
		</HStack>
	);
}

function PostAuthorField( { item } ) {
	const { text, imageUrl } = useSelect(
		( select ) => {
			const { getUser } = select( coreStore );
			const user = getUser( item.author );
			return {
				imageUrl: user?.avatar_urls?.[ 48 ],
				text: user?.name,
			};
		},
		[ item ]
	);
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	return (
		<HStack alignment="left" spacing={ 0 }>
			{ !! imageUrl && (
				<div
					className={ clsx( 'page-templates-author-field__avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt={ __( 'Author avatar' ) }
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ authorIcon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

function usePostFields( viewType ) {
	const { records: authors, isResolving: isLoadingAuthors } =
		useEntityRecords( 'root', 'user', { per_page: -1 } );

	const { frontPageId, postsPageId, getFeaturedMediaUrl } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			return {
				frontPageId: siteSettings?.page_on_front,
				postsPageId: siteSettings?.page_for_posts,
				getFeaturedMediaUrl: ( id ) =>
					getEntityRecord( 'root', 'media', id ),
			};
		},
		[]
	);

	const fields = useMemo(
		() => [
			{
				label: __( 'Title' ),
				id: 'title',
				type: 'text',
				getValue: ( { item } ) =>
					typeof item.title === 'string'
						? item.title
						: item.title?.raw,
				render: ( { item } ) => {
					const addLink =
						[ LAYOUT_TABLE, LAYOUT_GRID ].includes( viewType ) &&
						item.status !== 'trash';
					const renderedTitle =
						typeof item.title === 'string'
							? item.title
							: item.title?.rendered;
					const title = addLink ? (
						<Link
							params={ {
								postId: item.id,
								postType: item.type,
								canvas: 'edit',
							} }
						>
							{ decodeEntities( renderedTitle ) ||
								__( '(no title)' ) }
						</Link>
					) : (
						<span>
							{ decodeEntities( renderedTitle ) ||
								__( '(no title)' ) }
						</span>
					);

					let suffix = '';
					if ( item.id === frontPageId ) {
						suffix = (
							<span className="edit-site-post-list__title-badge">
								{ __( 'Homepage' ) }
							</span>
						);
					} else if ( item.id === postsPageId ) {
						suffix = (
							<span className="edit-site-post-list__title-badge">
								{ __( 'Posts Page' ) }
							</span>
						);
					}

					return (
						<HStack
							className="edit-site-post-list__title"
							alignment="center"
							justify="flex-start"
						>
							{ title }
							{ suffix }
						</HStack>
					);
				},
				enableHiding: false,
			},
			{
				label: __( 'Author' ),
				id: 'author',
				type: 'integer',
				elements:
					authors?.map( ( { id, name } ) => ( {
						value: id,
						label: name,
					} ) ) || [],
				render: PostAuthorField,
				sort: ( a, b, direction ) => {
					const nameA = a._embedded?.author?.[ 0 ]?.name || '';
					const nameB = b._embedded?.author?.[ 0 ]?.name || '';

					return direction === 'asc'
						? nameA.localeCompare( nameB )
						: nameB.localeCompare( nameA );
				},
			},
			{
				label: __( 'Status' ),
				id: 'status',
				type: 'text',
				elements: STATUSES,
				render: PostStatusField,
				Edit: 'radio',
				enableSorting: false,
				filterBy: {
					operators: [ OPERATOR_IS_ANY ],
				},
			},
			{
				label: __( 'Date' ),
				id: 'date',
				type: 'datetime',
				render: ( { item } ) => {
					const isDraftOrPrivate = [ 'draft', 'private' ].includes(
						item.status
					);
					if ( isDraftOrPrivate ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: page creation date */
								__( '<span>Modified: <time>%s</time></span>' ),
								getFormattedDate( item.date )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					const isScheduled = item.status === 'future';
					if ( isScheduled ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: page creation date */
								__( '<span>Scheduled: <time>%s</time></span>' ),
								getFormattedDate( item.date )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					const isPublished = item.status === 'publish';
					if ( isPublished ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: page creation time */
								__( '<span>Published: <time>%s</time></span>' ),
								getFormattedDate( item.date )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					// Pending posts show the modified date if it's newer.
					const dateToDisplay =
						getDate( item.modified ) > getDate( item.date )
							? item.modified
							: item.date;

					const isPending = item.status === 'pending';
					if ( isPending ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: the newest of created or modified date for the page */
								__( '<span>Modified: <time>%s</time></span>' ),
								getFormattedDate( dateToDisplay )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					// Unknow status.
					return <time>{ getFormattedDate( item.date ) }</time>;
				},
			},
			{
				id: 'comment_status',
				label: __( 'Discussion' ),
				type: 'text',
				Edit: 'radio',
				enableSorting: false,
				filterBy: {
					operators: [],
				},
				elements: [
					{
						value: 'open',
						label: __( 'Open' ),
						description: __(
							'Visitors can add new comments and replies.'
						),
					},
					{
						value: 'closed',
						label: __( 'Closed' ),
						description: __(
							'Visitors cannot add new comments or replies. Existing comments remain visible.'
						),
					},
				],
			},
			{
				id: 'featured_media',
				label: __( 'Featured Image' ),
				type: 'image',
				render: ( { item } ) => {
					const mediaId = item.featured_media;

					const media = getFeaturedMediaUrl( mediaId );

					const url = media?.source_url;
					const title = media?.title?.rendered;

					// This is a false positive
					// eslint-disable-next-line react-hooks/rules-of-hooks
					const { onClick } = useLink( {
						postId: item.id,
						postType: item.type,
						canvas: 'edit',
					} );

					if ( viewType === LAYOUT_GRID && item.status !== 'trash' ) {
						if ( ! url ) {
							return null;
						}
						return (
							<button
								className="edit-site-post-list__featured-image-button"
								type="button"
								onClick={ onClick }
								aria-label={
									item.title?.rendered || __( '(no title)' )
								}
							>
								<Media
									className="edit-site-post-list__featured-image"
									id={ item.featured_media }
									size={ [
										'large',
										'full',
										'medium',
										'thumbnail',
									] }
								/>
							</button>
						);
					}

					if ( viewType === LAYOUT_LIST ) {
						if ( ! url ) {
							return null;
						}

						return (
							<img
								className="edit-site-post-featured-image"
								src={ url }
								alt=""
							/>
						);
					}

					if ( ! url ) {
						return (
							<Flex gap={ 8 }>
								<FlexItem>
									<span className="edit-site-post-featured-image-placeholder" />
								</FlexItem>
								<FlexItem>
									<span>{ __( 'Choose an image…' ) }</span>
								</FlexItem>
							</Flex>
						);
					}

					return (
						<HStack>
							<img
								className="edit-site-post-featured-image"
								src={ url }
								alt=""
							/>
							<span>{ title }</span>
						</HStack>
					);
				},
				Edit: ( { field, onChange, data } ) => {
					const { id } = field;

					const value = field.getValue( { item: data } ) ?? '';

					const onChangeControl = useCallback(
						( newValue ) =>
							onChange( {
								[ id ]: newValue,
							} ),
						[ id, onChange ]
					);

					const media = getFeaturedMediaUrl( value );

					const url = media?.source_url;
					const title = media?.title?.rendered;
					const filename =
						media?.media_details?.file?.match( '([^/]+$)' )[ 0 ];

					return (
						<fieldset className="edit-site-dataviews-controls__featured-image">
							<div className="edit-side-dataviews-controls__featured-image-container">
								<MediaUpload
									onSelect={ ( selectedMedia ) =>
										onChangeControl( selectedMedia.id )
									}
									allowedTypes={ [ 'image' ] }
									render={ ( { open } ) => {
										return (
											<div
												role="button"
												tabIndex={ 0 }
												onClick={ ( event ) => {
													const element =
														event.target.tagName.toLowerCase();
													// Prevent opening the media modal when clicking on the button/icon.
													if (
														element !== 'button' &&
														element !== 'svg'
													) {
														open();
													}
												} }
												onKeyDown={ open }
											>
												<Grid
													rowGap={ 0 }
													columnGap={ 8 }
													templateColumns="24px 1fr 0.5fr"
													rows={ url ? 2 : 0 }
												>
													{ url && (
														<>
															<img
																alt=""
																src={ url }
															/>
															<Text
																as="span"
																truncate
																numberOfLines={
																	0
																}
															>
																{ title }
															</Text>
														</>
													) }
													{ ! url && (
														<>
															<span className="edit-site-post-featured-image-placeholder" />
															<span>
																{ __(
																	'Choose an image…'
																) }
															</span>
														</>
													) }
													{ url && (
														<>
															<Button
																size="small"
																className="edit-site-dataviews-controls__featured-image-remove-button"
																icon={
																	lineSolid
																}
																onClick={ () =>
																	onChangeControl(
																		0
																	)
																}
															/>
															<Text
																className="edit-site-dataviews-controls__featured-image-filename"
																as="span"
																ellipsizeMode="middle"
																limit={ 35 }
																truncate
																numberOfLines={
																	0
																}
															>
																{ filename }
															</Text>
														</>
													) }
												</Grid>
											</div>
										);
									} }
								/>
							</div>
						</fieldset>
					);
				},
				enableSorting: false,
			},
		],
		[ authors, getFeaturedMediaUrl, viewType, frontPageId, postsPageId ]
	);

	return {
		isLoading: isLoadingAuthors,
		fields,
	};
}

export default usePostFields;
