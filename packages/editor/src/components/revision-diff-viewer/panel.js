/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { Spinner, Notice, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { fetchRevisionDiff, fetchRevisions } from './utils/api';
import { RevisionSelector } from './revision-selector';
import { DiffSummary } from './diff-summary';
import { BlockDiffItem } from './block-diff-item';
import { store as editorStore } from '../../store';

/**
 * @typedef {import('./utils/types').RevisionDiff} RevisionDiff
 */

/**
 * Main revision diff viewer panel component.
 *
 * @return {JSX.Element} The rendered component
 */
export function RevisionDiffPanel() {
	const [ revisions, setRevisions ] = useState( [] );
	const [ fromId, setFromId ] = useState( null );
	const [ toId, setToId ] = useState( null );
	const [ diff, setDiff ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ showUnchanged, setShowUnchanged ] = useState( false );

	// Get the current post ID.
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);

	// Load revisions when post ID is available.
	useEffect( () => {
		if ( ! postId ) {
			return;
		}

		setIsLoading( true );
		setError( null );

		fetchRevisions( postId )
			.then( ( data ) => {
				setRevisions( data );
				// Auto-select first two revisions if available.
				if ( data.length >= 2 ) {
					setFromId( data[ 1 ].id ); // Older.
					setToId( data[ 0 ].id ); // Newer.
				}
			} )
			.catch( ( err ) => {
				setError( err.message || __( 'Failed to load revisions.' ) );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [ postId ] );

	// Load diff when revisions are selected.
	const loadDiff = useCallback( () => {
		if ( ! postId || ! fromId || ! toId || fromId === toId ) {
			setDiff( null );
			return;
		}

		setIsLoading( true );
		setError( null );

		fetchRevisionDiff( postId, fromId, toId )
			.then( ( data ) => {
				setDiff( data );
			} )
			.catch( ( err ) => {
				setError( err.message || __( 'Failed to load diff.' ) );
				setDiff( null );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [ postId, fromId, toId ] );

	// Load diff when selections change.
	useEffect( () => {
		loadDiff();
	}, [ loadDiff ] );

	// Filter blocks based on showUnchanged setting.
	const filteredBlocks = diff?.blocks?.filter(
		( block ) => showUnchanged || block.type !== 'unchanged'
	);

	if ( ! postId ) {
		return (
			<div className="revision-diff-viewer__panel">
				<Notice status="warning" isDismissible={ false }>
					{ __( 'No post selected.' ) }
				</Notice>
			</div>
		);
	}

	return (
		<div className="revision-diff-viewer__panel">
			<div className="revision-diff-viewer__header">
				<p className="revision-diff-viewer__description">
					{ __(
						'Compare revisions to see what blocks changed between versions.'
					) }
				</p>
			</div>

			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			{ isLoading && ! diff && (
				<div className="revision-diff-viewer__loading">
					<Spinner />
					<span>{ __( 'Loading…' ) }</span>
				</div>
			) }

			{ ! isLoading && revisions.length > 0 && (
				<RevisionSelector
					revisions={ revisions }
					fromId={ fromId }
					toId={ toId }
					onFromChange={ setFromId }
					onToChange={ setToId }
				/>
			) }

			{ fromId === toId && fromId !== null && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Please select two different revisions to compare.'
					) }
				</Notice>
			) }

			{ diff && (
				<>
					<DiffSummary summary={ diff.summary } />

					<div className="revision-diff-viewer__controls">
						<Button
							variant="tertiary"
							onClick={ () =>
								setShowUnchanged( ! showUnchanged )
							}
							__next40pxDefaultSize
						>
							{ showUnchanged
								? __( 'Hide unchanged blocks' )
								: __( 'Show unchanged blocks' ) }
						</Button>
					</div>

					<div className="revision-diff-viewer__blocks">
						{ filteredBlocks && filteredBlocks.length > 0 ? (
							filteredBlocks.map( ( block ) => (
								<BlockDiffItem
									key={ block.id }
									item={ block }
								/>
							) )
						) : (
							<p className="revision-diff-viewer__no-changes">
								{ __( 'No visible changes.' ) }
							</p>
						) }
					</div>
				</>
			) }

			{ ! isLoading && revisions.length < 2 && (
				<Notice status="info" isDismissible={ false }>
					{ __(
						'This post needs at least two revisions to compare. Make some changes and save to create revisions.'
					) }
				</Notice>
			) }
		</div>
	);
}
