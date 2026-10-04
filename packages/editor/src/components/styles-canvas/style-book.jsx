import { useCallback, useMemo, forwardRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import { store as interfaceStore } from '@wordpress/interface';
import StyleBook from '../style-book';
import { STYLE_BOOK_COLOR_GROUPS } from '../style-book/constants';
import { STYLE_BOOK_NOTES_SIDEBAR } from '../collab-sidebar/constants';
import { useStyleBookNotesContext } from '../style-book/notes/context';
import { useStyleBookNoteThreads } from '../style-book/notes/use-style-book-note-threads';
import { useStyleBookNotesEnabled } from '../style-book/notes/use-style-book-notes-enabled';
import { useGlobalStyles } from '../global-styles/hooks';

/**
 * Builds the notes affordances the Style Book renders beside each example.
 *
 * Returns `undefined` when notes are unavailable - no global styles record, or
 * a user or WordPress version that cannot store them - and the Style Book then
 * renders exactly as it did before notes existed.
 *
 * @return {Object|undefined} `noteActions` and the anchor to highlight.
 */
function useStyleBookNoteActions() {
	const { setPendingAnchor, activeAnchor, setActiveAnchor } =
		useStyleBookNotesContext();
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { isEnabled } = useStyleBookNotesEnabled();

	/*
	 * The badges need anchors and counts, not titles, so this deliberately
	 * skips building the label map: `getExamples()` walks every registered
	 * block type, and the sidebar already pays that cost once. Both hooks
	 * issue the same comment query, which core-data resolves once.
	 */
	const { counts } = useStyleBookNoteThreads( { enabled: isEnabled } );

	const openNotes = useCallback(
		( anchor ) => {
			enableComplementaryArea( 'core', STYLE_BOOK_NOTES_SIDEBAR );
			setActiveAnchor( anchor );
		},
		[ enableComplementaryArea, setActiveAnchor ]
	);

	/*
	 * The examples are rendered by a memoized component, so these have to hold
	 * their identity: a new object here re-renders every block preview in the
	 * Style Book each time the canvas renders.
	 */
	const noteActions = useMemo(
		() => ( {
			counts,
			onAddNote: ( anchor ) => {
				setPendingAnchor( anchor );
				openNotes( anchor );
			},
			/*
			 * Reviewing existing notes is not the start of a new one, so a form
			 * left armed for another example is dropped rather than carried
			 * into a sidebar that is now showing something else.
			 */
			onOpenNotes: ( anchor ) => {
				setPendingAnchor( null );
				openNotes( anchor );
			},
		} ),
		[ counts, openNotes, setPendingAnchor ]
	);

	if ( ! isEnabled ) {
		return {};
	}

	return { highlightedAnchor: activeAnchor, noteActions };
}

function StyleBookWithNavigation( {
	path,
	onPathChange,
	userConfig,
	forwardedRef,
	noteActions,
	highlightedAnchor,
} ) {
	return (
		<StyleBook
			ref={ forwardedRef }
			path={ path }
			userConfig={ userConfig }
			noteActions={ noteActions }
			highlightedAnchor={ highlightedAnchor }
			isSelected={ ( blockName ) =>
				// Match '/blocks/core%2Fbutton' and
				// '/blocks/core%2Fbutton/typography', but not
				// '/blocks/core%2Fbuttons'.
				path === `/blocks/${ encodeURIComponent( blockName ) }` ||
				path?.startsWith(
					`/blocks/${ encodeURIComponent( blockName ) }/`
				)
			}
			onSelect={ ( blockName ) => {
				if (
					STYLE_BOOK_COLOR_GROUPS.find(
						( group ) => group.slug === blockName
					)
				) {
					// Go to color palettes Global Styles.
					onPathChange?.( '/colors/palette' );
					return;
				}
				if ( blockName === 'typography' ) {
					// Go to typography Global Styles.
					onPathChange?.( '/typography' );
					return;
				}

				// Now go to the selected block.
				onPathChange?.( '/blocks/' + encodeURIComponent( blockName ) );
			} }
		/>
	);
}

function StylesCanvasRevisionStyleBook( { path, onPathChange, forwardedRef } ) {
	const { user: userConfig } = useGlobalStyles();
	const { revisions, isLoading } = useGlobalStylesRevisions();

	const revisionId = useMemo( () => {
		const match = path?.match( /^\/revisions\/(.+)$/ );
		return match ? match[ 1 ] : null;
	}, [ path ] );

	const selectedRevision = useMemo( () => {
		if ( ! revisionId || ! revisions.length ) {
			return null;
		}
		return revisions.find(
			( revision ) => String( revision.id ) === String( revisionId )
		);
	}, [ revisionId, revisions ] );

	if ( isLoading ) {
		return null;
	}

	return (
		<StyleBookWithNavigation
			forwardedRef={ forwardedRef }
			path={ path }
			onPathChange={ onPathChange }
			userConfig={ selectedRevision || userConfig }
		/>
	);
}

/**
 * Style Book content component for global styles.
 * Provides the business logic for StyleBook behavior in the global styles context.
 *
 * @param {Object}             props              Component props.
 * @param {string}             props.path         Current path in global styles.
 * @param {Function}           props.onPathChange Callback when the path changes.
 * @param {React.ForwardedRef} ref                Ref to the Style Book component.
 * @return {React.JSX.Element} The Style Book component.
 */
function StylesCanvasStyleBook( { path, onPathChange }, ref ) {
	// Revisions preview an older set of styles, so notes - which belong to the
	// current one - are left off there, matching the notes sidebar.
	const { noteActions, highlightedAnchor } = useStyleBookNoteActions();

	if ( path?.startsWith( '/revisions' ) ) {
		return (
			<StylesCanvasRevisionStyleBook
				forwardedRef={ ref }
				path={ path }
				onPathChange={ onPathChange }
			/>
		);
	}

	return (
		<StyleBookWithNavigation
			forwardedRef={ ref }
			path={ path }
			onPathChange={ onPathChange }
			noteActions={ noteActions }
			highlightedAnchor={ highlightedAnchor }
		/>
	);
}

export default forwardRef( StylesCanvasStyleBook );
