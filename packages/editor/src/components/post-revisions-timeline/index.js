/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataViewsPicker, filterSortAndPaginate } from '@wordpress/dataviews';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { authorField } from '@wordpress/fields';
import { Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { PostContentInformationUI } from '../post-content-information';

const PAGE_SIZE = 10;
const EMPTY_ARRAY = [];
const defaultLayouts = { pickerActivity: true };
const baseView = {
	type: 'pickerActivity',
	titleField: 'date',
	descriptionField: 'details',
	fields: [ 'author' ],
	layout: { density: 'compact' },
	page: 1,
	perPage: PAGE_SIZE,
};

const DAY_IN_MILLISECONDS = 86400000;

function getDisplayDate( value ) {
	const dateNowInMs = getDate( null ).getTime();
	const date = getDate( value ?? null );
	return dateNowInMs - date.getTime() > DAY_IN_MILLISECONDS
		? dateI18n( getSettings().formats.datetimeAbbreviated, date )
		: humanTimeDiff( date );
}

export default function PostRevisionsTimeline() {
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );
	const [ view, setView ] = useState( baseView );

	const { revisions, revisionKey, currentRevisionId, currentRevision } =
		useSelect( ( select ) => {
			const { getCurrentPostType } = select( editorStore );
			const {
				getCurrentRevisionId: _getCurrentRevisionId,
				getCurrentRevision,
				getRevisionPage,
				getPageRevisions,
			} = unlock( select( editorStore ) );
			const { getEntityConfig } = select( coreStore );

			const _postType = getCurrentPostType();
			const entityConfig = getEntityConfig( 'postType', _postType );
			const _revisionKey = entityConfig?.revisionKey || 'id';
			const _currentRevisionId = _getCurrentRevisionId();

			return {
				// Same desc-ordered window the header slider renders (warm cache).
				revisions: getPageRevisions( getRevisionPage() ),
				revisionKey: _revisionKey,
				currentRevisionId: _currentRevisionId,
				currentRevision: _currentRevisionId
					? getCurrentRevision()
					: undefined,
			};
		}, [] );

	const postContent = currentRevision?.content?.raw;

	const isLoading = ! revisions;

	const fields = useMemo(
		() => [
			{
				id: 'date',
				label: __( 'Date' ),
				// Return the humanized label the row renders so the picker
				// option's accessible name announces e.g. "5 minutes ago"
				// instead of the raw ISO timestamp.
				getValue: ( { item } ) => getDisplayDate( item.date ),
				render: ( { item } ) => (
					<Text
						variant="heading-sm"
						render={ <time dateTime={ item.date } /> }
					>
						{ getDisplayDate( item.date ) }
					</Text>
				),
				enableSorting: false,
				enableHiding: false,
			},
			authorField,
			{
				id: 'details',
				label: __( 'Details' ),
				render: ( { item } ) => {
					if (
						String( item[ revisionKey ] ) !==
						String( currentRevisionId )
					) {
						return null;
					}
					return (
						<PostContentInformationUI postContent={ postContent } />
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
		],
		[ revisionKey, currentRevisionId, postContent ]
	);

	const { data: shownRevisions, paginationInfo } = useMemo(
		() => filterSortAndPaginate( revisions || EMPTY_ARRAY, view, fields ),
		[ revisions, view, fields ]
	);

	// Keep the selected revision visible: when it changes (e.g. the slider
	// scrubs), jump to the client-side page that contains it. Keyed on the
	// selection/data, not view.page, so manual paging stays free browsing.
	useEffect( () => {
		if ( ! currentRevisionId || ! revisions ) {
			return;
		}
		const index = revisions.findIndex(
			( r ) => String( r[ revisionKey ] ) === String( currentRevisionId )
		);
		if ( index < 0 ) {
			return;
		}
		const page = Math.floor( index / view.perPage ) + 1;
		setView( ( v ) => ( v.page === page ? v : { ...v, page } ) );
	}, [ currentRevisionId, revisions, revisionKey, view.perPage ] );

	const selection = useMemo(
		() =>
			currentRevisionId ? [ String( currentRevisionId ) ] : EMPTY_ARRAY,
		[ currentRevisionId ]
	);

	const onChangeSelection = useCallback(
		( newSelection ) => {
			// Revisions mode always keeps one revision selected. Clicking the
			// active revision yields an empty selection, which we ignore so the
			// timeline never ends up with nothing selected.
			if ( newSelection.length === 0 ) {
				return;
			}
			const selectedId = newSelection[ newSelection.length - 1 ];
			setCurrentRevisionId( Number( selectedId ) );
		},
		[ setCurrentRevisionId ]
	);

	const getItemId = useCallback(
		( item ) => String( item[ revisionKey ] ),
		[ revisionKey ]
	);

	return (
		<div className="editor-post-revisions-timeline">
			<DataViewsPicker
				view={ view }
				onChangeView={ setView }
				fields={ fields }
				data={ shownRevisions }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ getItemId }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
			>
				<DataViewsPicker.Layout />
				<DataViewsPicker.Footer />
			</DataViewsPicker>
		</div>
	);
}
