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
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { authorField } from '@wordpress/fields';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from '../post-last-revision/check';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );
const DAY_IN_MILLISECONDS = 86400000;
const EMPTY_ARRAY = [];

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
	fields: [ 'author' ],
	layout: {
		density: 'compact',
	},
};
const fields = [
	{
		id: 'date',
		label: __( 'Date' ),
		render: ( { item } ) => {
			const dateNowInMs = getDate( null ).getTime();
			const date = getDate( item.date ?? null );
			const displayDate =
				dateNowInMs - date.getTime() > DAY_IN_MILLISECONDS
					? dateI18n(
							getSettings().formats.datetimeAbbreviated,
							date
					  )
					: humanTimeDiff( date );
			return (
				<time
					className="editor-post-revisions-panel__revision-date"
					dateTime={ item.date }
				>
					{ displayDate }
				</time>
			);
		},
		enableSorting: false,
		enableHiding: false,
	},
	authorField,
];
const noop = () => {};
const paginationInfo = {};

function PostRevisionsPanelContent() {
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );
	const { revisionsCount, revisions, isLoading, lastRevisionId } = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const {
				getCurrentPostRevisionsCount,
				getCurrentPostLastRevisionId,
			} = select( editorStore );
			const { getRevisions, isResolving } = select( coreStore );
			const query = [
				'postType',
				getCurrentPostType(),
				getCurrentPostId(),
				REVISIONS_QUERY,
			];
			const _revisions = getRevisions( ...query );
			return {
				revisionsCount: getCurrentPostRevisionsCount(),
				lastRevisionId: getCurrentPostLastRevisionId(),
				revisions: _revisions,
				isLoading: isResolving( 'getRevisions', query ),
			};
		},
		[]
	);
	return (
		<PanelBody
			title={
				<HStack justify="space-between" align="center" as="span">
					<span>{ __( 'Revisions' ) }</span>
					<Badge className="editor-post-revisions-panel__revisions-count">
						{ revisionsCount }
					</Badge>
				</HStack>
			}
			initialOpen={ false }
		>
			<VStack className="editor-post-revisions-panel">
				<DataViews
					view={ view }
					onChangeView={ noop }
					fields={ fields }
					data={ revisions || EMPTY_ARRAY }
					isLoading={ isLoading }
					paginationInfo={ paginationInfo }
					defaultLayouts={ defaultLayouts }
					getItemId={ ( item ) => item.id }
					isItemClickable={ () => true }
					onClickItem={ ( item ) => {
						setCurrentRevisionId( item.id );
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
