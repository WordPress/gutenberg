/**
 * WordPress dependencies
 */
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { useState, useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import usePostRevisions from './use-post-revisions';
import RevisionsHeader from './revisions-header';
import RevisionsCanvas from './revisions-canvas';

export { usePostRevisions, RevisionsHeader, RevisionsCanvas };

/**
 * Revisions mode interface component.
 * Manages revision selection state and renders the revisions UI.
 *
 * @param {Object} props           Component props.
 * @param {string} props.className Additional class name for the interface.
 * @return {JSX.Element} The revisions interface component.
 */
export function RevisionsInterface( props ) {
	const { revisions, isLoading: isRevisionsLoading } = usePostRevisions();
	const [ selectedRevisionIndex, setSelectedRevisionIndex ] = useState( 0 );

	// Sort revisions by date (newest first) and memoize.
	const sortedRevisions = useMemo( () => {
		if ( ! revisions.length ) {
			return [];
		}
		return [ ...revisions ].sort(
			( a, b ) => new Date( b.date ) - new Date( a.date )
		);
	}, [ revisions ] );

	const selectedRevision = sortedRevisions[ selectedRevisionIndex ] || null;

	const handleSelectRevisionIndex = useCallback( ( index ) => {
		setSelectedRevisionIndex( index );
	}, [] );

	return (
		<InterfaceSkeleton
			{ ...props }
			header={
				<RevisionsHeader
					revisions={ sortedRevisions }
					selectedRevision={ selectedRevision }
					selectedIndex={ selectedRevisionIndex }
					onSelectIndex={ handleSelectRevisionIndex }
					isLoading={ isRevisionsLoading }
				/>
			}
			content={ <RevisionsCanvas revision={ selectedRevision } /> }
			sidebar={ <ComplementaryArea.Slot scope="core" /> }
		/>
	);
}
