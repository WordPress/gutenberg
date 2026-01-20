/**
 * WordPress dependencies
 */
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import RevisionsHeader from './revisions-header';
import RevisionsCanvas from './revisions-canvas';
import { store as editorStore } from '../../store';

export { RevisionsHeader, RevisionsCanvas };

/**
 * Revisions mode interface component.
 * Manages revision selection state and renders the revisions UI.
 *
 * @param {Object} props           Component props.
 * @param {string} props.className Additional class name for the interface.
 * @return {JSX.Element} The revisions interface component.
 */
export function RevisionsInterface( props ) {
	const { revisions, isLoading: isRevisionsLoading } = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const { getRevisions, isResolving } = select( coreStore );

			const postId = getCurrentPostId();
			const postType = getCurrentPostType();

			if ( ! postId || ! postType ) {
				return;
			}

			const query = { per_page: -1, context: 'edit' };
			return {
				revisions: getRevisions( 'postType', postType, postId, query ),
				isLoading: isResolving( 'getRevisions', [
					'postType',
					postType,
					postId,
					query,
				] ),
			};
		},
		[]
	);

	const [ selectedRevisionIndex, setSelectedRevisionIndex ] = useState( 0 );

	// Sort revisions by date (newest first) and memoize.
	const sortedRevisions = useMemo( () => {
		return (
			revisions?.sort(
				( a, b ) => new Date( b.date ) - new Date( a.date )
			) ?? []
		);
	}, [ revisions ] );

	const selectedRevision = sortedRevisions[ selectedRevisionIndex ];

	return (
		<InterfaceSkeleton
			{ ...props }
			header={
				<RevisionsHeader
					revisions={ sortedRevisions }
					selectedRevision={ selectedRevision }
					selectedIndex={ selectedRevisionIndex }
					onSelectIndex={ setSelectedRevisionIndex }
					isLoading={ isRevisionsLoading }
				/>
			}
			content={ <RevisionsCanvas revision={ selectedRevision } /> }
			sidebar={ <ComplementaryArea.Slot scope="core" /> }
		/>
	);
}
