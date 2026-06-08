/**
 * External dependencies
 */
/*
 * `diffWordsWithSpace` preserves the v4-style per-word output. v6+
 * stopped treating whitespace as a token in `diffWords`, which coalesces
 * adjacent word changes into a single removed/added pair.
 */
import { diffWordsWithSpace } from 'diff';

/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataViewsPicker, filterSortAndPaginate } from '@wordpress/dataviews';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { authorField } from '@wordpress/fields';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { PostContentInformationUI } from '../post-content-information';
import { RevisionDiffEntries } from '../revision-diff-panel';

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

		result[ key ] = diffWordsWithSpace( prevStr, revStr );
	}

	if ( Object.keys( result ).length === 0 ) {
		return null;
	}

	return result;
}

export default function PostRevisionsTimeline() {
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );
	const [ view, setView ] = useState( baseView );

	const {
		revisions,
		revisionKey,
		currentRevisionId,
		postContent,
		diffEntries,
	} = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );
		const {
			getCurrentRevisionId: _getCurrentRevisionId,
			getCurrentRevision,
			getPreviousRevision,
			getRevisionPage,
			getPageRevisions,
		} = unlock( select( editorStore ) );
		const { getEntityConfig } = select( coreStore );

		const _postType = getCurrentPostType();
		const entityConfig = getEntityConfig( 'postType', _postType );
		const _revisionKey = entityConfig?.revisionKey || 'id';
		const _currentRevisionId = _getCurrentRevisionId();

		const currentRevision = _currentRevisionId
			? getCurrentRevision()
			: undefined;
		const previousRevision = _currentRevisionId
			? getPreviousRevision()
			: undefined;

		return {
			// Same desc-ordered window the header slider renders (warm cache).
			revisions: getPageRevisions( getRevisionPage() ),
			revisionKey: _revisionKey,
			currentRevisionId: _currentRevisionId,
			postContent: currentRevision?.content?.raw,
			diffEntries: computeDiffEntries(
				currentRevision,
				previousRevision
			),
		};
	}, [] );

	const isLoading = ! revisions;

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
						<Stack
							className="editor-post-revisions-timeline__details"
							direction="row"
							gap="sm"
							justify="flex-start"
							align="center"
						>
							<PostContentInformationUI
								postContent={ postContent }
							/>
							{ diffEntries && (
								<Dropdown
									popoverProps={ {
										placement: 'bottom-start',
									} }
									renderToggle={ ( { isOpen, onToggle } ) => (
										<Button
											size="small"
											icon={ info }
											label={ __(
												'View changed fields'
											) }
											aria-expanded={ isOpen }
											onClick={ ( event ) => {
												// Stop the row's selection toggle from firing.
												event.stopPropagation();
												onToggle();
											} }
										/>
									) }
									renderContent={ () => (
										<div className="editor-post-revisions-timeline__diff">
											<RevisionDiffEntries
												entries={ diffEntries }
											/>
										</div>
									) }
								/>
							) }
						</Stack>
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
		],
		[ revisionKey, currentRevisionId, postContent, diffEntries ]
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
			<DataViewsPicker.Pagination />
		</DataViewsPicker>
	);
}
