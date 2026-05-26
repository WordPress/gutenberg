/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews, type Field, type View } from '@wordpress/dataviews';
import { dateI18n, getSettings, humanTimeDiff } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	drafts as draftsIcon,
	postFeaturedImage,
	trash,
} from '@wordpress/icons';
import { EmptyState, IconButton, Link, Stack, Text, Icon } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import styles from './drafts-list.module.css';

type FeaturedMedia = {
	source_url?: string;
	media_details?: {
		sizes?: Record< string, { source_url?: string } >;
	};
};

type DraftPost = {
	id: number;
	title: { rendered: string };
	date: string;
	_embedded?: {
		'wp:featuredmedia'?: FeaturedMedia[];
	};
};

/*
 * Most recent drafts across the site, newest first. `_embed` pulls the
 * featured media into each record in the same request, so the thumbnail needs
 * no extra fetch per row.
 */
const DRAFTS_QUERY = {
	status: 'draft',
	orderby: 'date',
	order: 'desc',
	per_page: 20,
	_embed: 'wp:featuredmedia',
};

const DEFAULT_LAYOUTS = { list: {} };

const INITIAL_VIEW: View = {
	type: 'list',
	page: 1,
	perPage: DRAFTS_QUERY.per_page,
	search: '',
	filters: [],
	fields: [],
	titleField: 'title',
	descriptionField: 'date',
	mediaField: 'featured',
	showMedia: true,
	layout: { density: 'compact' },
};

function getEditUrl( postId: number ) {
	return addQueryArgs( 'post.php', { post: postId, action: 'edit' } );
}

/* Prefers the small thumbnail size, falling back to larger ones, then full. */
function getThumbnailUrl( post: DraftPost ) {
	const media = post._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ];
	const sizes = media?.media_details?.sizes;
	return (
		sizes?.thumbnail?.source_url ??
		sizes?.medium?.source_url ??
		media?.source_url
	);
}

/* Featured image, or a placeholder where an inline upload could live (follow-up). */
function DraftThumbnail( { post }: { post: DraftPost } ) {
	const url = getThumbnailUrl( post );

	if ( url ) {
		return (
			<img
				className={ styles.thumbImage }
				src={ url }
				alt=""
				loading="lazy"
			/>
		);
	}

	return (
		<div className={ styles.thumbPlaceholder } aria-hidden="true">
			<Icon icon={ postFeaturedImage } />
		</div>
	);
}

function DraftTitle( {
	post,
	onDelete,
}: {
	post: DraftPost;
	onDelete: ( id: number ) => void;
} ) {
	const title =
		decodeEntities( post.title?.rendered ?? '' ) || __( '(no title)' );

	return (
		<Stack
			direction="row"
			align="center"
			justify="space-between"
			gap="sm"
			className={ styles.titleRow }
		>
			<Link
				href={ getEditUrl( post.id ) }
				openInNewTab
				className={ styles.titleLink }
			>
				{ title }
			</Link>

			<IconButton
				icon={ trash }
				label={ __( 'Delete draft' ) }
				variant="minimal"
				size="small"
				onClick={ () => onDelete( post.id ) }
			/>
		</Stack>
	);
}

function DraftDate( { post }: { post: DraftPost } ) {
	const fullDate = dateI18n( getSettings().formats.datetime, post.date );

	return (
		<Text
			variant="body-sm"
			className={ styles.date }
			render={ <span title={ fullDate } /> }
		>
			{ humanTimeDiff( post.date ) }
		</Text>
	);
}

/*
 * Renders the most recent drafts through the DataViews list layout. Mounting
 * this component is what triggers the drafts request, so the dashboard only
 * fetches the list when the widget has room to show it.
 */
export function DraftsList() {
	const [ view, setView ] = useState< View >( INITIAL_VIEW );

	const { drafts, isLoading } = useSelect( ( select ) => {
		const { getEntityRecords, hasFinishedResolution } =
			select( coreDataStore );
		const records = getEntityRecords( 'postType', 'post', DRAFTS_QUERY ) as
			| DraftPost[]
			| null;

		return {
			drafts: records ?? [],
			isLoading: ! hasFinishedResolution( 'getEntityRecords', [
				'postType',
				'post',
				DRAFTS_QUERY,
			] ),
		};
	}, [] );

	const { deleteEntityRecord } = useDispatch( coreDataStore );

	/* Trashes the draft (recoverable); core-data drops it from the list. */
	const deleteDraft = useCallback(
		( id: number ) => {
			void deleteEntityRecord( 'postType', 'post', id, undefined );
		},
		[ deleteEntityRecord ]
	);

	const fields = useMemo< Field< DraftPost >[] >(
		() => [
			{
				id: 'title',
				label: __( 'Title' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => (
					<DraftTitle post={ item } onDelete={ deleteDraft } />
				),
			},
			{
				id: 'date',
				label: __( 'Date' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <DraftDate post={ item } />,
			},
			{
				id: 'featured',
				label: __( 'Featured image' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <DraftThumbnail post={ item } />,
			},
		],
		[ deleteDraft ]
	);

	return (
		<Stack direction="column" className={ styles.root }>
			<Text variant="heading-md" className={ styles.titleHeader }>
				{ __( 'Your recent drafts' ) }
			</Text>

			<DataViews
				data={ drafts }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				getItemId={ ( item ) => String( item.id ) }
				isLoading={ isLoading }
				paginationInfo={ { totalItems: drafts.length, totalPages: 1 } }
				defaultLayouts={ DEFAULT_LAYOUTS }
				empty={
					<EmptyState.Root>
						<EmptyState.Icon icon={ draftsIcon } />
						<EmptyState.Description>
							{ __( 'No drafts yet.' ) }
						</EmptyState.Description>
					</EmptyState.Root>
				}
			>
				<DataViews.Layout />
			</DataViews>
		</Stack>
	);
}
