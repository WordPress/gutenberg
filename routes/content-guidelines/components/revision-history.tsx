/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	Navigator,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { store as noticesStore } from '@wordpress/notices';
import type { View, Field, Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store';
import {
	fetchContentGuidelinesRevisions,
	restoreContentGuidelinesRevision,
	fetchContentGuidelines,
} from '../api';
import type { ContentGuidelinesRevision } from '../types';

const DEFAULT_VIEW: View = {
	type: 'table' as const,
	fields: [ 'date', 'author' ],
	page: 1,
	perPage: 10,
	layout: {
		enableMoving: false,
		styles: {
			author: { align: 'end' },
		},
	},
};

export default function RevisionHistory() {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ revisions, setRevisions ] = useState< ContentGuidelinesRevision[] >(
		[]
	);
	const [ isLoading, setIsLoading ] = useState( false );
	const [ revisionToRestore, setRevisionToRestore ] =
		useState< ContentGuidelinesRevision | null >( null );
	const [ isRestoring, setIsRestoring ] = useState( false );
	const [ refetchKey, setRefetchKey ] = useState( 0 );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const guidelinesId = useSelect(
		( select ) =>
			(
				select( STORE_NAME ) as unknown as {
					getId: () => number | null;
				}
			 ).getId(),
		[]
	);

	useEffect( () => {
		if ( ! guidelinesId ) {
			return;
		}

		async function loadRevisions() {
			setIsLoading( true );
			try {
				const result = await fetchContentGuidelinesRevisions( {
					guidelinesId: guidelinesId!,
					perPage: 100,
				} );
				setRevisions( result.revisions );
			} catch {
				createErrorNotice(
					__( 'Could not load revision history. Please try again.' ),
					{ type: 'snackbar' }
				);
			} finally {
				setIsLoading( false );
			}
		}

		loadRevisions();
	}, [ guidelinesId, refetchKey, createErrorNotice ] );

	const authorElements = useMemo( () => {
		return [
			...new Set(
				revisions.map(
					( r ) => r._embedded?.author?.[ 0 ]?.name ?? __( 'Unknown' )
				)
			),
		].map( ( name ) => ( { value: name, label: name } ) );
	}, [ revisions ] );

	const fields = useMemo< Field< ContentGuidelinesRevision >[] >(
		() => [
			{
				id: 'date',
				type: 'date' as const,
				label: __( 'Date' ),
				getValue: ( { item } ) => item.date,
				render: ( { item } ) => (
					<time dateTime={ item.date }>
						{ dateI18n(
							getSettings().formats.datetimeAbbreviated,
							getDate( item.date )
						) }
					</time>
				),
				enableSorting: false,
				enableHiding: false,
				filterBy: {
					operators: [ 'before', 'after', 'between', 'inThePast' ],
				},
			},
			{
				id: 'author',
				label: __( 'User' ),
				getValue: ( { item } ) =>
					item._embedded?.author?.[ 0 ]?.name ?? __( 'Unknown' ),
				render: ( { item } ) => (
					<span>
						{ item._embedded?.author?.[ 0 ]?.name ??
							__( 'Unknown' ) }
					</span>
				),
				enableSorting: false,
				enableHiding: false,
				enableGlobalSearch: true,
				elements: authorElements,
				filterBy: {
					operators: [ 'isAny', 'isNone' ],
				},
			},
		],
		[ authorElements ]
	);

	const { data: displayedRevisions, paginationInfo } = useMemo(
		() => filterSortAndPaginate( revisions, view, fields ),
		[ revisions, view, fields ]
	);

	const actions = useMemo< Action< ContentGuidelinesRevision >[] >(
		() => [
			{
				id: 'restore-revision',
				label: __( 'Restore' ),
				callback: ( items ) => setRevisionToRestore( items[ 0 ] ),
			},
		],
		[ setRevisionToRestore ]
	);

	async function handleRestore() {
		if ( ! guidelinesId || ! revisionToRestore ) {
			return;
		}
		setIsRestoring( true );
		try {
			await restoreContentGuidelinesRevision(
				guidelinesId,
				revisionToRestore.id
			);
			await fetchContentGuidelines();
			setRevisionToRestore( null );
			setRefetchKey( ( k ) => k + 1 );
			createSuccessNotice( __( 'Revision restored.' ), {
				type: 'snackbar',
			} );
		} catch {
			createErrorNotice(
				__( 'Could not restore revision. Please try again.' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsRestoring( false );
		}
	}

	return (
		<div className="content-guidelines__revision-history">
			<Navigator.BackButton
				icon={ isRTL() ? chevronRight : chevronLeft }
				className="content-guidelines__revision-history-back"
			>
				{ __( 'Revision history' ) }
			</Navigator.BackButton>

			<Text
				size={ 13 }
				weight={ 400 }
				variant="muted"
				className="content-guidelines__revision-description"
			>
				{ __( 'Use a previous version of your guidelines.' ) }
			</Text>

			<DataViews
				data={ displayedRevisions }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				getItemId={ ( item ) => String( item.id ) }
			/>

			{ revisionToRestore && (
				<Modal
					title={ __( 'Restore guidelines' ) }
					onRequestClose={ () => setRevisionToRestore( null ) }
					size="medium"
				>
					<VStack spacing={ 4 }>
						<Text size={ 13 } weight={ 400 }>
							{ sprintf(
								/* translators: %s: formatted revision date */
								__(
									'You are about to restore the guidelines from %s.'
								),
								dateI18n(
									getSettings().formats.datetimeAbbreviated,
									getDate( revisionToRestore.date )
								)
							) }
						</Text>
						<Text size={ 13 } weight={ 400 }>
							{ __(
								'You can undo this anytime from revision history.'
							) }
						</Text>
					</VStack>
					<HStack
						justify="flex-end"
						className="content-guidelines__restore-modal-actions"
					>
						<Button
							variant="tertiary"
							onClick={ () => setRevisionToRestore( null ) }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ handleRestore }
							isBusy={ isRestoring }
							disabled={ isRestoring }
							__next40pxDefaultSize
						>
							{ __( 'Restore' ) }
						</Button>
					</HStack>
				</Modal>
			) }
		</div>
	);
}
