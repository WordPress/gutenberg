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
const defaultLayouts = { activity: {} };
const noop = () => {};
const paginationInfo = {};
const view = {
	type: 'activity',
	titleField: 'date',
	fields: [ 'author' ],
	layout: { density: 'compact' },
};
const fields = [
	{
		id: 'date',
		label: __( 'Date' ),
		render: ( { item, field } ) => {
			const dateNowInMs = getDate( null ).getTime();
			const _value = field.getValue( { item } );
			const date = getDate( _value ?? null );
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
					dateTime={ _value }
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

function PostRevisionsPanelContent() {
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );
	const {
		revisionsCount,
		revisions,
		revisionKey,
		isLoading,
		lastRevisionId,
	} = useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const { getCurrentPostRevisionsCount, getCurrentPostLastRevisionId } =
			select( editorStore );
		const { getRevisions, getEntityConfig, isResolving } =
			select( coreStore );
		const _postType = getCurrentPostType();
		const entityConfig = getEntityConfig( 'postType', _postType );
		const _revisionKey = entityConfig?.revisionKey || 'id';
		const revisionsQuery = {
			per_page: 3,
			orderby: 'date',
			order: 'desc',
			_fields: `${ _revisionKey },date,author`,
		};
		const query = [
			'postType',
			_postType,
			getCurrentPostId(),
			revisionsQuery,
		];
		const _revisions = getRevisions( ...query );
		return {
			revisionsCount: getCurrentPostRevisionsCount(),
			lastRevisionId: getCurrentPostLastRevisionId(),
			revisions: _revisions,
			revisionKey: _revisionKey,
			isLoading: isResolving( 'getRevisions', query ),
		};
	}, [] );
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
					getItemId={ ( item ) => item[ revisionKey ] }
					isItemClickable={ () => true }
					onClickItem={ ( item ) => {
						setCurrentRevisionId( item[ revisionKey ] );
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
