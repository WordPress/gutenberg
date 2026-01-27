/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { dateI18n, getSettings } from '@wordpress/date';
import {
	Spinner,
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store } from '../../store';
import type { GuidelineCategories } from '../../store/constants';

interface RevisionListProps {
	postId: number | undefined;
	onRestore?: ( data: { guideline_categories: GuidelineCategories } ) => void;
}

/**
 * Revision list component for displaying revision history.
 *
 * @param props           Component props.
 * @param props.postId    The guidelines post ID.
 * @param props.onRestore Callback when a revision is restored.
 * @return RevisionList component.
 */
export default function RevisionList( {
	postId,
	onRestore,
}: RevisionListProps ) {
	const {
		revisions,
		isLoading,
		restoringId,
		error,
		currentPage,
		totalPages,
		totalItems,
		perPage,
	} = useSelect( ( select ) => {
		const selectors = select( store );
		const pagination = selectors.getRevisionPagination();
		return {
			revisions: selectors.getRevisions(),
			isLoading: selectors.isLoadingRevisions(),
			restoringId: selectors.getRestoringRevisionId(),
			error: selectors.getError(),
			currentPage: pagination.currentPage,
			totalPages: pagination.totalPages,
			totalItems: pagination.totalItems,
			perPage: pagination.perPage,
		};
	}, [] );

	const { fetchRevisions, restoreRevision } = useDispatch( store );

	useEffect( () => {
		if ( postId ) {
			fetchRevisions( postId, 1, 5 );
		}
	}, [ postId, fetchRevisions ] );

	const handlePageChange = useCallback(
		( page: number ) => {
			if ( postId ) {
				fetchRevisions( postId, page, 5 );
			}
		},
		[ postId, fetchRevisions ]
	);

	const handleRestore = async ( revisionId: number ) => {
		if ( ! postId || ! onRestore ) {
			return;
		}

		try {
			const response = await restoreRevision( postId, revisionId );
			onRestore( {
				guideline_categories: response.guideline_categories,
			} );
		} catch {
			// Error is handled by the store
		}
	};

	if ( ! postId ) {
		return null;
	}

	if ( isLoading ) {
		return (
			<div className="content-guidelines-revisions content-guidelines-revisions--loading">
				<Spinner />
				<p>{ __( 'Loading revisions…' ) }</p>
			</div>
		);
	}

	if ( error ) {
		return (
			<div className="content-guidelines-revisions content-guidelines-revisions--error">
				<p>{ error }</p>
			</div>
		);
	}

	if ( ! revisions.length ) {
		return (
			<div className="content-guidelines-revisions">
				<h3>{ __( 'Revision History' ) }</h3>
				<p className="content-guidelines-revisions__empty">
					{ __( 'No revisions yet.' ) }
				</p>
			</div>
		);
	}

	const dateFormat = getSettings().formats.datetime;

	const isCurrent = ( index: number ) => currentPage === 1 && index === 0;

	// Calculate revision number based on pagination
	const getRevisionNumber = ( index: number ) => {
		const offset = ( currentPage - 1 ) * perPage;
		return totalItems - offset - index;
	};

	return (
		<div className="content-guidelines-revisions">
			<h3>{ __( 'Revision History' ) }</h3>
			<table className="content-guidelines-revisions__table">
				<tbody>
					{ revisions.map( ( revision, index ) => (
						<tr key={ revision.id }>
							<td className="revision-item__number">
								{ isCurrent( index )
									? __( 'Current' )
									: `#${ getRevisionNumber( index ) }` }
							</td>
							<td className="revision-item__date">
								{ dateI18n( dateFormat, revision.date ) }
							</td>
							<td className="revision-item__author">
								{ revision.author_name || __( 'Unknown' ) }
							</td>
							<td className="revision-item__action">
								{ ! isCurrent( index ) && onRestore && (
									<Button
										variant="tertiary"
										size="small"
										onClick={ () =>
											handleRestore( revision.id )
										}
										isBusy={ restoringId === revision.id }
										disabled={ restoringId !== null }
										accessibleWhenDisabled
									>
										{ restoringId === revision.id
											? __( 'Restoring…' )
											: __( 'Restore' ) }
									</Button>
								) }
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
			{ totalPages > 1 && (
				<div className="content-guidelines-revisions__pagination">
					<HStack spacing={ 2 } justify="center">
						<Button
							icon={ chevronLeft }
							label={ __( 'Previous page' ) }
							onClick={ () =>
								handlePageChange( currentPage - 1 )
							}
							disabled={ currentPage === 1 }
							accessibleWhenDisabled
							__next40pxDefaultSize
						/>
						<Text>
							{ currentPage } { __( 'of' ) } { totalPages }
						</Text>
						<Button
							icon={ chevronRight }
							label={ __( 'Next page' ) }
							onClick={ () =>
								handlePageChange( currentPage + 1 )
							}
							disabled={ currentPage === totalPages }
							accessibleWhenDisabled
							__next40pxDefaultSize
						/>
					</HStack>
				</div>
			) }
		</div>
	);
}
