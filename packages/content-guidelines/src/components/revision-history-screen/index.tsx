/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	Button,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { store as noticesStore } from '@wordpress/notices';
import { DataViews } from '@wordpress/dataviews';
import type { Action, View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { store } from '../../store';
import type { GuidelineCategories, Revision } from '../../store/constants';
import ScreenHeader from '../screen-header';

interface RevisionItem {
	id: string;
	revisionId: number;
	date: string;
	authorName: string;
	isCurrent: boolean;
}

export default function RevisionHistoryScreen() {
	const {
		guidelines,
		revisions,
		isLoadingRevisions,
		restoringId,
		currentPage,
		totalPages,
		totalItems,
		perPage,
	} = useSelect( ( select ) => {
		const selectors = select( store );
		const pagination = selectors.getRevisionPagination();
		return {
			guidelines: selectors.getGuidelines(),
			revisions: selectors.getRevisions(),
			isLoadingRevisions: selectors.isLoadingRevisions(),
			restoringId: selectors.getRestoringRevisionId(),
			currentPage: pagination.currentPage,
			totalPages: pagination.totalPages,
			totalItems: pagination.totalItems,
			perPage: pagination.perPage,
		};
	}, [] );

	const { fetchRevisions, restoreRevision, updateCategory } =
		useDispatch( store );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const postId = guidelines?.id;

	useEffect( () => {
		if ( postId ) {
			fetchRevisions();
		}
	}, [ postId, fetchRevisions ] );

	const items: RevisionItem[] = useMemo( () => {
		return revisions.map( ( revision: Revision, index: number ) => ( {
			id: String( revision.id ),
			revisionId: revision.id,
			date: revision.date,
			authorName: revision.author_name || __( 'Unknown' ),
			isCurrent: currentPage === 1 && index === 0,
		} ) );
	}, [ revisions, currentPage ] );

	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		fields: [ 'date', 'authorName' ],
		page: currentPage,
		perPage,
	} );

	const handleChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );

	const handleRestore = useCallback(
		async ( revisionItem: RevisionItem ) => {
			if ( ! postId ) {
				return;
			}

			try {
				const response = await restoreRevision(
					postId,
					revisionItem.revisionId
				);
				const categories = (
					response as {
						guideline_categories: GuidelineCategories;
					}
				 ).guideline_categories;
				if ( categories ) {
					(
						Object.keys( categories ) as Array<
							keyof GuidelineCategories
						>
					 ).forEach( ( key ) => {
						updateCategory( key, categories[ key ] );
					} );
				}
				createSuccessNotice( __( 'Revision restored successfully.' ), {
					type: 'snackbar',
				} );
			} catch {
				createErrorNotice( __( 'Failed to restore revision.' ), {
					type: 'snackbar',
				} );
			}
		},
		[
			postId,
			restoreRevision,
			updateCategory,
			createSuccessNotice,
			createErrorNotice,
		]
	);

	const fields = useMemo(
		() => [
			{
				id: 'date',
				label: __( 'Date' ),
				enableSorting: false,
				render: ( { item }: { item: RevisionItem } ) => (
					<span>
						{ dateI18n( 'F j, Y \\a\\t g:i a', item.date ) }
						{ item.isCurrent && <em> ({ __( 'current' ) })</em> }
					</span>
				),
			},
			{
				id: 'authorName',
				label: __( 'User' ),
				enableSorting: false,
			},
		],
		[]
	);

	const actions: Action< RevisionItem >[] = useMemo(
		() => [
			{
				id: 'restore',
				label: __( 'Restore' ),
				modalHeader: __( 'Restore content guidelines' ),
				RenderModal: ( {
					items: modalItems,
					closeModal,
				}: {
					items: RevisionItem[];
					closeModal?: () => void;
				} ) => {
					const item = modalItems[ 0 ];
					const formattedDate = dateI18n(
						'F j, Y \\a\\t g:i a',
						item.date
					);

					return (
						<VStack spacing={ 4 }>
							<Text>
								{ __(
									'You are about to restore the content guidelines from'
								) }{ ' ' }
								{ formattedDate }.
							</Text>
							<Text>
								<strong>
									{ __( 'This action cannot be undone.' ) }
								</strong>
							</Text>
							<HStack justify="right" spacing={ 3 }>
								<Button
									variant="tertiary"
									onClick={ closeModal }
									__next40pxDefaultSize
								>
									{ __( 'Cancel' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ () => {
										handleRestore( item );
										closeModal?.();
									} }
									__next40pxDefaultSize
								>
									{ __( 'Restore' ) }
								</Button>
							</HStack>
						</VStack>
					);
				},
				isEligible: ( item: RevisionItem ) =>
					! item.isCurrent && restoringId === null,
			},
		],
		[ handleRestore, restoringId ]
	);

	const paginationInfo = {
		totalItems,
		totalPages,
	};

	if ( ! postId ) {
		return (
			<>
				<ScreenHeader
					title={ __( 'Revision history' ) }
					description={ __(
						'Use a previous version of your content guidelines.'
					) }
				/>
				<Text>{ __( 'No revisions yet.' ) }</Text>
			</>
		);
	}

	if ( isLoadingRevisions && revisions.length === 0 ) {
		return (
			<>
				<ScreenHeader
					title={ __( 'Revision history' ) }
					description={ __(
						'Use a previous version of your content guidelines.'
					) }
				/>
				<VStack spacing={ 4 } alignment="center">
					<Spinner />
					<Text>{ __( 'Loading revisions\u2026' ) }</Text>
				</VStack>
			</>
		);
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Revision history' ) }
				description={ __(
					'Use a previous version of your content guidelines.'
				) }
			/>
			{ items.length === 0 ? (
				<Text>{ __( 'No revisions yet.' ) }</Text>
			) : (
				<DataViews
					data={ items }
					fields={ fields }
					view={ view }
					onChangeView={ handleChangeView }
					actions={ actions }
					paginationInfo={ paginationInfo }
					defaultLayouts={ {
						table: {},
					} }
					search
					isLoading={ isLoadingRevisions }
					getItemId={ ( item: RevisionItem ) => item.id }
				/>
			) }
		</>
	);
}
