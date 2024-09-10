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
	useRef,
	useEffect,
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
	copySmall,
} from '@wordpress/icons';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalInputControl as InputControl,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	ExternalLink,
	Icon,
	Button,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useCopyToClipboard } from '@wordpress/compose';
import { safeDecodeURIComponent } from '@wordpress/url';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	LAYOUT_GRID,
	LAYOUT_TABLE,
	LAYOUT_LIST,
	OPERATOR_IS_ANY,
} from '../../utils/constants';
import { default as Link, useLink } from '../routes/link';
import Media from '../media';

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

function FeaturedImage( { item, viewType } ) {
	const isDisabled = item.status === 'trash';
	const { onClick } = useLink( {
		postId: item.id,
		postType: item.type,
		canvas: 'edit',
	} );
	const hasMedia = !! item.featured_media;
	const size =
		viewType === LAYOUT_GRID
			? [ 'large', 'full', 'medium', 'thumbnail' ]
			: [ 'thumbnail', 'medium', 'large', 'full' ];
	const media = hasMedia ? (
		<Media
			className="edit-site-post-list__featured-image"
			id={ item.featured_media }
			size={ size }
		/>
	) : null;
	const renderButton = viewType !== LAYOUT_LIST && ! isDisabled;
	return (
		<div
			className={ `edit-site-post-list__featured-image-wrapper is-layout-${ viewType }` }
		>
			{ renderButton ? (
				<button
					className="edit-site-post-list__featured-image-button"
					type="button"
					onClick={ onClick }
					aria-label={ item.title?.rendered || __( '(no title)' ) }
				>
					{ media }
				</button>
			) : (
				media
			) }
		</div>
	);
}

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

function LinkField( { item } ) {
	const slug = item.slug;
	const originalSlug = useRef( slug );

	useEffect( () => {
		if ( slug && originalSlug.current === undefined ) {
			originalSlug.current = slug;
		}
	}, [ slug ] );

	const slugToDisplay = slug || originalSlug.current;

	return `/${ slugToDisplay ?? '' }`;
}

function usePostFields( viewType ) {
	const { records: authors, isResolving: isLoadingAuthors } =
		useEntityRecords( 'root', 'user', { per_page: -1 } );

	const { frontPageId, postsPageId } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );
		return {
			frontPageId: siteSettings?.page_on_front,
			postsPageId: siteSettings?.page_for_posts,
		};
	}, [] );

	const fields = useMemo(
		() => [
			{
				id: 'featured-image',
				label: __( 'Featured Image' ),
				getValue: ( { item } ) => item.featured_media,
				render: ( { item } ) => (
					<FeaturedImage item={ item } viewType={ viewType } />
				),
				enableSorting: false,
			},
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
				label: __( 'Link' ),
				id: 'slug',
				getValue: ( { item } ) => item.slug,
				render: LinkField,
				Edit: ( { field, onChange, data } ) => {
					const { id } = field;

					const slug = field.getValue( { item: data } ) ?? '';
					const permalinkTemplate = data.permalink_template || '';
					const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
					const [ prefix, suffix ] = permalinkTemplate.split(
						PERMALINK_POSTNAME_REGEX
					);
					const permalinkPrefix = prefix;
					const permalinkSuffix = suffix;
					const isEditable =
						PERMALINK_POSTNAME_REGEX.test( permalinkTemplate );
					const originalSlug = useRef( slug );
					const slugToDisplay = slug || originalSlug.current;
					const permalink = isEditable
						? `${ permalinkPrefix }${ slugToDisplay }${ permalinkSuffix }`
						: safeDecodeURIComponent( data.link || '' );

					useEffect( () => {
						if ( slug && originalSlug.current === undefined ) {
							originalSlug.current = slug;
						}
					}, [ slug ] );

					const onChangeControl = useCallback(
						( newValue ) =>
							onChange( {
								[ id ]: newValue,
							} ),
						[ id, onChange ]
					);

					const { createNotice } = useDispatch( noticesStore );

					const copyButtonRef = useCopyToClipboard( permalink, () => {
						createNotice(
							'info',
							__( 'Copied URL to clipboard.' ),
							{
								isDismissible: true,
								type: 'snackbar',
							}
						);
					} );

					return (
						<fieldset className="edit-site-dataviews-controls__slug">
							{ isEditable && (
								<VStack>
									<VStack spacing="0px">
										<span>
											{ __(
												'Customize the last part of the URL.'
											) }
										</span>
										<ExternalLink
											href="https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink"
											target="_blank"
										>
											{ __( 'Learn more' ) }
										</ExternalLink>
									</VStack>
									<InputControl
										__next40pxDefaultSize
										prefix={
											<InputControlPrefixWrapper>
												/
											</InputControlPrefixWrapper>
										}
										suffix={
											<Button
												__next40pxDefaultSize
												icon={ copySmall }
												ref={ copyButtonRef }
												label={ __( 'Copy' ) }
											/>
										}
										label={ __( 'Link' ) }
										hideLabelFromVision
										value={ slug }
										autoComplete="off"
										spellCheck="false"
										type="text"
										className="edit-site-dataviews-controls__slug-input"
										onChange={ ( newValue ) => {
											onChangeControl( newValue );
										} }
										onBlur={ () => {
											if ( slug === '' ) {
												onChangeControl(
													originalSlug.current
												);
											}
										} }
										help={
											<ExternalLink
												className="edit-site-dataviews-controls__slug-help"
												href={ permalink }
												target="_blank"
											>
												<span>{ permalinkPrefix }</span>
												<span className="edit-site-dataviews-controls__slug-help-slug">
													{ slugToDisplay }
												</span>
												<span className="edit-site-dataviews-controls__slug-help-suffix">
													{ permalinkSuffix }
												</span>
											</ExternalLink>
										}
									/>
								</VStack>
							) }
							{ ! isEditable && (
								<ExternalLink
									className="edit-site-dataviews-controls__slug-help"
									href={ permalink }
									target="_blank"
								>
									{ permalink }
								</ExternalLink>
							) }
						</fieldset>
					);
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
		],
		[ authors, viewType, frontPageId, postsPageId ]
	);

	return {
		isLoading: isLoadingAuthors,
		fields,
	};
}

export default usePostFields;
