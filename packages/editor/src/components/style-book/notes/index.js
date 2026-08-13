import { __ } from '@wordpress/i18n';
import { useMemo, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { comment as commentIcon } from '@wordpress/icons';
import PluginSidebar from '../../plugin-sidebar';
import { STYLE_BOOK_NOTES_SIDEBAR } from '../../collab-sidebar/constants';
import { getExamples } from '../examples';
import { useMultiOriginPalettes } from '../index';
import { getAnchorLabels } from './anchors';
import { StyleBookNotesPanel } from './sidebar';
import { useStyleBookNoteThreads } from './use-style-book-note-threads';
import { useStyleBookNotesEnabled } from './use-style-book-notes-enabled';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

function StyleBookNotesSidebar( { globalStylesId } ) {
	const sidebarRef = useRef( null );
	const colors = useMultiOriginPalettes();

	// The labels come from the examples the Style Book actually renders, so an
	// anchor pointing at something no longer on screen falls into the "Other
	// notes" bucket instead of getting a title it does not have.
	const labels = useMemo(
		() => getAnchorLabels( getExamples( colors ) ),
		[ colors ]
	);

	const { groups } = useStyleBookNoteThreads( { labels } );

	return (
		<PluginSidebar
			identifier={ STYLE_BOOK_NOTES_SIDEBAR }
			name={ STYLE_BOOK_NOTES_SIDEBAR }
			title={ __( 'Style Book notes' ) }
			header={
				<h2 className="interface-complementary-area-header__title">
					{ __( 'Style Book notes' ) }
				</h2>
			}
			icon={ commentIcon }
			closeLabel={ __( 'Close Style Book notes' ) }
		>
			<StyleBookNotesPanel
				groups={ groups }
				labels={ labels }
				globalStylesId={ globalStylesId }
				sidebarRef={ sidebarRef }
			/>
		</PluginSidebar>
	);
}

/**
 * Mounts the Style Book notes sidebar when the Style Book is open in the
 * styles canvas.
 *
 * Revisions reuse the Style Book to preview an older set of styles. Notes
 * there would read as notes on the revision, which they are not, so the
 * sidebar stays out - matching the post editor, which hides notes in revisions
 * mode too.
 *
 * @return {React.JSX.Element|null} The sidebar, or nothing outside the Style Book.
 */
export default function StyleBookNotes() {
	const { showStylebook, isRevisions } = useSelect( ( select ) => {
		const { getShowStylebook, getStylesPath } = unlock(
			select( editorStore )
		);
		return {
			showStylebook: getShowStylebook(),
			isRevisions: !! getStylesPath()?.startsWith( '/revisions' ),
		};
	}, [] );

	// This component is mounted for the whole editor session, so the checks
	// wait until the Style Book is actually open rather than adding requests
	// to every site editor load.
	const { globalStylesId, isEnabled } = useStyleBookNotesEnabled( {
		enabled: showStylebook && ! isRevisions,
	} );

	if ( ! showStylebook || isRevisions || ! isEnabled ) {
		return null;
	}

	return <StyleBookNotesSidebar globalStylesId={ globalStylesId } />;
}
