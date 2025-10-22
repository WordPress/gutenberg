/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import Revisions from '../revisions';
import { useGlobalStyles } from './hooks';

/**
 * Revisions integration - renders conditionally when revisions view is active.
 * Coordinates with ScreenRevisions through the path parameter to display
 * the currently selected revision.
 *
 * @param {Object} props      Component props.
 * @param {string} props.path Current path in global styles.
 * @return {JSX.Element|null} The Revisions component or null.
 */
export function GlobalStylesRevisions( { path } ) {
	const { editorCanvasContainerView, blocks } = useSelect( ( select ) => {
		return {
			// This is not ideal: it's like a loop (reading from block-editor to render it).
			blocks: select( blockEditorStore ).getBlocks(),
			editorCanvasContainerView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
		};
	}, [] );
	const { user: userConfig } = useGlobalStyles();

	// Fetch all revisions (includes unsaved, parent, and enriched with authors)
	const { revisions, isLoading } = useGlobalStylesRevisions();

	// Parse revision ID from path (e.g., "/revisions/123" -> "123")
	const revisionId = useMemo( () => {
		const match = path?.match( /^\/revisions\/(.+)$/ );
		return match ? match[ 1 ] : null;
	}, [ path ] );

	// Find the selected revision from the fetched list
	const selectedRevision = useMemo( () => {
		if ( ! revisionId || ! revisions.length ) {
			return null;
		}
		return revisions.find(
			( rev ) => String( rev.id ) === String( revisionId )
		);
	}, [ revisionId, revisions ] );

	// Only render when on the revisions path and the appropriate canvas view is active
	const shouldRender =
		path?.startsWith( '/revisions' ) &&
		editorCanvasContainerView === 'global-styles-revisions';

	if ( ! shouldRender || isLoading ) {
		return null;
	}

	// Use the selected revision's config if available, otherwise use current user config
	const displayConfig = selectedRevision || userConfig;

	return <Revisions userConfig={ displayConfig } blocks={ blocks } />;
}
