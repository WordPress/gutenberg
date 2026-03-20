/**
 * WordPress dependencies
 */
import {
	PanelBody,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';
import {
	humanTimeDiff,
	dateI18n,
	getSettings as getDateSettings,
} from '@wordpress/date';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from '../post-last-revision/check';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

const REVISIONS_QUERY = {
	per_page: 3,
	orderby: 'date',
	order: 'desc',
	context: 'embed',
	_fields: 'id,date,author',
};
const defaultLayouts = { activity: {} };
const view = {
	type: 'activity',
	titleField: 'date',
	descriptionField: 'authorName',
	groupBy: {
		field: 'day',
		direction: 'desc',
		showLabel: false,
	},
	layout: {
		density: 'compact',
	},
};
const fields = [
	{
		id: 'date',
		label: __( 'Date' ),
		render: ( { item } ) => humanTimeDiff( item.date ),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'authorName',
		label: __( 'Author' ),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'day',
		label: __( 'Day' ),
		getValue: ( { item } ) => dateI18n( 'Y-m-d', item.date ),
		render: ( { item } ) =>
			dateI18n( getDateSettings().formats.date, item.date ),
		enableSorting: false,
		enableHiding: false,
	},
];
const noop = () => {};
const paginationInfo = {};

function PostRevisionsPanelContent() {
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );
	const { revisionsCount, revisions, isLoading, authors, lastRevisionId } =
		useSelect( ( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const {
				getCurrentPostRevisionsCount,
				getCurrentPostLastRevisionId,
			} = select( editorStore );
			const { getRevisions, isResolving, getUsers } = select( coreStore );
			const _postId = getCurrentPostId();
			const _postType = getCurrentPostType();
			const _revisions =
				_postId && _postType
					? getRevisions(
							'postType',
							_postType,
							_postId,
							REVISIONS_QUERY
					  )
					: null;
			// Collect unique author IDs from revisions.
			const authorIds = _revisions
				? [ ...new Set( _revisions.map( ( r ) => r.author ) ) ]
				: [];
			const _authors =
				authorIds.length > 0
					? getUsers( {
							include: authorIds,
							per_page: authorIds.length,
							context: 'view',
					  } )
					: null;
			return {
				revisionsCount: getCurrentPostRevisionsCount(),
				lastRevisionId: getCurrentPostLastRevisionId(),
				revisions: _revisions,
				isLoading: isResolving( 'getRevisions', [
					'postType',
					_postType,
					_postId,
					REVISIONS_QUERY,
				] ),
				authors: _authors,
			};
		}, [] );
	const data = useMemo( () => {
		if ( ! revisions ) {
			return [];
		}
		const authorsMap = Object.fromEntries(
			authors?.map( ( a ) => [ a.id, a ] ) ?? []
		);
		return revisions.map( ( revision ) => ( {
			id: String( revision.id ),
			revisionId: revision.id,
			authorName: authorsMap[ revision.author ]?.name,
			date: revision.date,
			content: revision.content,
			modified: revision.modified,
		} ) );
	}, [ revisions, authors ] );
	return (
		<PanelBody
			title={
				<HStack justify="space-between" align="center" as="span">
					<span>{ __( 'Revisions' ) }</span>
					<Badge>{ revisionsCount }</Badge>
				</HStack>
			}
			initialOpen={ false }
		>
			<VStack className="editor-post-revisions-panel">
				<DataViews
					view={ view }
					onChangeView={ noop }
					fields={ fields }
					data={ data }
					isLoading={ isLoading }
					paginationInfo={ paginationInfo }
					defaultLayouts={ defaultLayouts }
					getItemId={ ( item ) => item.id }
					isItemClickable={ () => true }
					onClickItem={ ( item ) => {
						setCurrentRevisionId( item.revisionId );
					} }
				>
					<DataViews.Layout />
				</DataViews>
				<Button
					className="editor-post-revisions-panel__view-all"
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => setCurrentRevisionId( lastRevisionId ) }
				>
					{ __( 'View all revisions' ) }
				</Button>
			</VStack>
		</PanelBody>
	);
}

export default function PostRevisionsPanel() {
	return (
		<PostLastRevisionCheck>
			<PostRevisionsPanelContent />
		</PostLastRevisionCheck>
	);
}
