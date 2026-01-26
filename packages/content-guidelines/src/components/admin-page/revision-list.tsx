/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { dateI18n, getSettings } from '@wordpress/date';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface Revision {
	id: number;
	date: string;
	author_name: string;
}

interface RevisionListProps {
	postId: number | undefined;
}

/**
 * Revision list component for displaying revision history.
 *
 * @param props        Component props.
 * @param props.postId The guidelines post ID.
 * @return RevisionList component.
 */
export default function RevisionList( { postId }: RevisionListProps ) {
	const [ revisions, setRevisions ] = useState< Revision[] >( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		if ( ! postId ) {
			setRevisions( [] );
			return;
		}

		const fetchRevisions = async () => {
			setIsLoading( true );
			setError( null );

			try {
				const response = await apiFetch< Revision[] >( {
					path: `/__experimental/content-guidelines/${ postId }/revisions`,
				} );
				setRevisions( response );
			} catch ( err ) {
				setError(
					( err as Error ).message ||
						__( 'Failed to load revisions.' )
				);
			} finally {
				setIsLoading( false );
			}
		};

		fetchRevisions();
	}, [ postId ] );

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
					</li>
				) ) }
			</ul>
		</div>
	);
}
