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
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { arrowLeft } from '@wordpress/icons';
import type { View, Field, Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store';
import {
	fetchContentGuidelinesRevisions,
	restoreContentGuidelinesRevision,
} from '../api';
import type { ContentGuidelinesRevision } from '../types';

const DEFAULT_VIEW: View = {
	type: 'table' as const,
	fields: [ 'date', 'author' ],
	page: 1,
	perPage: 10,
};

function formatDate( dateString: string ): string {
	return new Intl.DateTimeFormat( undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	} ).format( new Date( dateString ) );
}

const FIELDS: Field< ContentGuidelinesRevision >[] = [
	{
		id: 'date',
		label: __( 'Date' ),
		getValue: ( { item } ) => item.date,
		render: ( { item } ) => (
			<time dateTime={ item.date }>{ formatDate( item.date ) }</time>
		),
		enableSorting: false,
		enableHiding: false,
		enableGlobalSearch: false,
	},
	{
		id: 'author',
		label: __( 'User' ),
		getValue: ( { item } ) =>
			item._embedded?.author?.[ 0 ]?.name ?? __( 'Unknown' ),
		render: ( { item } ) => (
			<span>
				{ item._embedded?.author?.[ 0 ]?.name ?? __( 'Unknown' ) }
			</span>
		),
		enableSorting: false,
		enableHiding: false,
		enableGlobalSearch: true,
	},
];

export default function RevisionHistory() {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ revisions, setRevisions ] = useState< ContentGuidelinesRevision[] >(
		[]
	);
	const [ total, setTotal ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ revisionToRestore, setRevisionToRestore ] =
		useState< ContentGuidelinesRevision | null >( null );
	const [ isRestoring, setIsRestoring ] = useState( false );

	// @ts-ignore
	const guidelinesId = useSelect(
		// @ts-ignore
		( select ) => select( STORE_NAME ).getId(),
		[]
	) as number | null;

	useEffect( () => {
		if ( ! guidelinesId ) {
			return;
		}
		setIsLoading( true );
		fetchContentGuidelinesRevisions( {
			guidelinesId,
			page: view.page,
			perPage: view.perPage,
			search: view.search,
		} )
			.then( ( result ) => {
				setRevisions( result.revisions );
				setTotal( result.total );
				setTotalPages( result.totalPages );
			} )
			.finally( () => setIsLoading( false ) );
	}, [ guidelinesId, view.page, view.perPage, view.search ] );

	const actions: Action< ContentGuidelinesRevision >[] = [
		{
			id: 'restore-revision',
			label: __( 'Restore' ),
			callback: ( items ) => setRevisionToRestore( items[ 0 ] ),
		},
	];

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
			setRevisionToRestore( null );
			setView( ( v ) => ( { ...v, page: 1 } ) );
		} finally {
			setIsRestoring( false );
		}
	}

	return (
		<div className="content-guidelines__revision-history">
			<Navigator.BackButton
				icon={ arrowLeft }
				className="content-guidelines__revision-history-back"
			>
				{ __( 'Revision history' ) }
			</Navigator.BackButton>

			<Text
				size={ 13 }
				weight={ 400 }
				className="content-guidelines__revision-history-description"
			>
				{ __( 'Use a previous version of your content guidelines.' ) }
			</Text>

			<DataViews
				data={ revisions }
				fields={ FIELDS }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				isLoading={ isLoading }
				paginationInfo={ { totalItems: total, totalPages } }
				defaultLayouts={ { table: {} } }
				getItemId={ ( item ) => String( item.id ) }
			/>

			{ revisionToRestore && (
				<Modal
					title={ __( 'Restore content guidelines' ) }
					onRequestClose={ () => setRevisionToRestore( null ) }
					size="medium"
				>
					<VStack spacing={ 4 }>
						<Text size={ 13 } weight={ 400 }>
							{ sprintf(
								/* translators: %s: formatted revision date */
								__(
									'You are about to restore the content guidelines from %s.'
								),
								formatDate( revisionToRestore.date )
							) }
						</Text>
						<Text size={ 13 } weight={ 400 }>
							{ __( 'This action cannot be undone.' ) }
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
