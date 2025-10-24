/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, forwardRef } from '@wordpress/element';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Revisions from '../revisions';
import { useGlobalStyles } from '../global-styles/hooks';

/**
 * Revisions content component for global styles.
 * Coordinates with ScreenRevisions through the path parameter to display
 * the currently selected revision.
 *
 * @param {Object}                       props      Component props.
 * @param {string}                       props.path Current path in global styles.
 * @param {import('react').ForwardedRef} ref        Ref to the Revisions component.
 * @return {JSX.Element|null} The Revisions component or null if loading.
 */
function StylesCanvasRevisions( { path }, ref ) {
	const blocks = useSelect( ( select ) => {
		// This is not ideal: it's like a loop (reading from block-editor to render it).
		return select( blockEditorStore ).getBlocks();
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

	if ( isLoading ) {
		return null;
	}

	// Use the selected revision's config if available, otherwise use current user config
	const displayConfig = selectedRevision || userConfig;

	return (
		<Revisions ref={ ref } userConfig={ displayConfig } blocks={ blocks } />
	);
}
export default forwardRef( StylesCanvasRevisions );
