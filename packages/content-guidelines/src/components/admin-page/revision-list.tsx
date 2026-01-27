/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { dateI18n, getSettings } from '@wordpress/date';
import { Spinner, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
	const { revisions, isLoading, restoringId, error } = useSelect(
		( select ) => {
			const selectors = select( store );
			return {
				revisions: selectors.getRevisions(),
				isLoading: selectors.isLoadingRevisions(),
				restoringId: selectors.getRestoringRevisionId(),
				error: selectors.getError(),
			};
		},
		[]
	);

	const { fetchRevisions, restoreRevision } = useDispatch( store );

	useEffect( () => {
		if ( postId ) {
			fetchRevisions( postId );
		}
	}, [ postId, fetchRevisions ] );

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

	return (
		<div className="content-guidelines-revisions">
			<h3>{ __( 'Revision History' ) }</h3>
			<ul className="content-guidelines-revisions__list">
				{ revisions.map( ( revision, index ) => (
					<li key={ revision.id } className="revision-item">
						<span className="revision-item__number">
							{ index === 0
								? __( 'Current' )
								: `#${ revisions.length - index }` }
						</span>
						<span className="revision-item__date">
							{ dateI18n( dateFormat, revision.date ) }
						</span>
						<span className="revision-item__author">
							{ revision.author_name || __( 'Unknown' ) }
						</span>
						{ index > 0 && onRestore && (
							<Button
								variant="tertiary"
								size="small"
								className="revision-item__restore"
								onClick={ () => handleRestore( revision.id ) }
								isBusy={ restoringId === revision.id }
								disabled={ restoringId !== null }
								accessibleWhenDisabled
							>
								{ restoringId === revision.id
									? __( 'Restoring…' )
									: __( 'Restore' ) }
							</Button>
						) }
					</li>
				) ) }
			</ul>
		</div>
	);
}
