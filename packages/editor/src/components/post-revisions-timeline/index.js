/**
 * External dependencies
 */
import { diffWords } from 'diff/lib/diff/word';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataViewsPicker } from '@wordpress/dataviews';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { authorField } from '@wordpress/fields';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { PostContentInformationUI } from '../post-content-information';
import { RevisionDiffEntries } from '../revision-diff-panel';

const PAGE_SIZE = 5;
const EMPTY_ARRAY = [];
const defaultLayouts = { pickerActivity: true };

const DAY_IN_MILLISECONDS = 86400000;

function stringifyValue( value ) {
	if ( value === null || value === undefined ) {
		return '';
	}
	if ( typeof value === 'object' ) {
		return JSON.stringify( value, null, 2 );
	}
	return String( value );
}

function computeDiffEntries( revision, previousRevision ) {
	if ( ! revision ) {
		return null;
	}

	const revisionMeta = revision.meta ?? {};
	const previousMeta = previousRevision?.meta ?? {};
	const allMetaKeys = new Set( [
		...Object.keys( revisionMeta ),
		...Object.keys( previousMeta ),
	] );

	const result = {};

	for ( const key of allMetaKeys ) {
		const revStr = stringifyValue( revisionMeta[ key ] );
		const prevStr = stringifyValue( previousMeta[ key ] );

		if ( ! revStr && ! prevStr ) {
			continue;
		}

		result[ key ] = diffWords( prevStr, revStr );
	}

	if ( Object.keys( result ).length === 0 ) {
		return null;
	}

	return result;
}

export default function PostRevisionsTimeline() {
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	const {
		revisions,
		revisionsCount,
		revisionKey,
		currentRevisionId,
		isLoading,
		postContent,
		diffEntries,
	} = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const { getCurrentPostRevisionsCount } = select( editorStore );
			const {
				getCurrentRevisionId: _getCurrentRevisionId,
				getCurrentRevision,
				getPreviousRevision,
			} = unlock( select( editorStore ) );
			const { getRevisions, getEntityConfig, isResolving } =
				select( coreStore );

			const _postType = getCurrentPostType();
			const _postId = getCurrentPostId();
			const entityConfig = getEntityConfig( 'postType', _postType );
			const _revisionKey = entityConfig?.revisionKey || 'id';
			const _currentRevisionId = _getCurrentRevisionId();

			const revisionsQuery = {
				per_page: PAGE_SIZE,
				page: currentPage,
				orderby: 'date',
				order: 'desc',
				_fields: `${ _revisionKey },date,author`,
			};
			const query = [ 'postType', _postType, _postId, revisionsQuery ];
			const _revisions = getRevisions( ...query );

			const currentRevision = _currentRevisionId
				? getCurrentRevision()
				: undefined;
			const previousRevision = _currentRevisionId
				? getPreviousRevision()
				: undefined;

			return {
				revisions: _revisions,
				revisionsCount: getCurrentPostRevisionsCount(),
				revisionKey: _revisionKey,
				currentRevisionId: _currentRevisionId,
				isLoading: isResolving( 'getRevisions', query ),
				postContent: currentRevision?.content?.raw,
				diffEntries: computeDiffEntries(
					currentRevision,
					previousRevision
				),
			};
		},
		[ currentPage ]
	);

	const totalPages = Math.ceil( revisionsCount / PAGE_SIZE );

	const view = useMemo(
		() => ( {
			type: 'pickerActivity',
			titleField: 'date',
			descriptionField: 'details',
			fields: [ 'author' ],
			layout: { density: 'compact' },
			page: currentPage,
			perPage: PAGE_SIZE,
		} ),
		[ currentPage ]
	);

	const fields = useMemo(
		() => [
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
							className="editor-post-revisions-timeline__revision-date"
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
						<>
							<PostContentInformationUI
								postContent={ postContent }
							/>
							<RevisionDiffEntries entries={ diffEntries } />
						</>
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
		],
		[ revisionKey, currentRevisionId, postContent, diffEntries ]
	);

	const selection = useMemo(
		() =>
			currentRevisionId ? [ String( currentRevisionId ) ] : EMPTY_ARRAY,
		[ currentRevisionId ]
	);

	const onChangeSelection = useCallback(
		( newSelection ) => {
			const selectedId = newSelection[ newSelection.length - 1 ];
			if ( selectedId ) {
				setCurrentRevisionId( Number( selectedId ) );
			}
		},
		[ setCurrentRevisionId ]
	);

	const onChangeView = useCallback(
		( newView ) => {
			if ( newView.page !== currentPage ) {
				setCurrentPage( newView.page );
			}
		},
		[ currentPage ]
	);

	const getItemId = useCallback(
		( item ) => String( item[ revisionKey ] ),
		[ revisionKey ]
	);

	return (
		<DataViewsPicker
			view={ view }
			onChangeView={ onChangeView }
			fields={ fields }
			data={ revisions || EMPTY_ARRAY }
			isLoading={ isLoading }
			paginationInfo={ {
				totalItems: revisionsCount,
				totalPages,
			} }
			defaultLayouts={ defaultLayouts }
			getItemId={ getItemId }
			selection={ selection }
			onChangeSelection={ onChangeSelection }
		>
			<DataViewsPicker.Layout />
			<DataViewsPicker.Pagination />
		</DataViewsPicker>
	);
}
