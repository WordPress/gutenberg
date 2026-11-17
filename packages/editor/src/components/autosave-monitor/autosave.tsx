import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import AutosaveMonitor from './index';
import useAutosaveNotice from './use-autosave-notice';
import useBrowserBackup from './use-browser-backup';

type PostAutosaveProps = Parameters< typeof useAutosaveNotice >[ 0 ];

function PostAutosave( props: PostAutosaveProps ) {
	useBrowserBackup();
	useAutosaveNotice( props );
	const hasServerAutosave = useSelect(
		( select ) =>
			!! (
				select( editorStore ).getEditorSettings() as {
					autosaveInterval?: number;
				}
			 ).autosaveInterval,
		[]
	);
	return hasServerAutosave ? <AutosaveMonitor /> : null;
}

/**
 * Autosaves the edited post to the server, backs it up in the browser, and
 * offers a newer autosave or backup on load.
 *
 * Mounted once the post is the edited one, and keyed by post, so each post
 * gets its own decision and its notice goes away with it. Post types that
 * don't support autosave get none of it.
 *
 * @param props Props passed to `useAutosaveNotice`.
 */
export default function Autosave( props: PostAutosaveProps ) {
	const { postType, postId } = props;
	const isReady = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			return (
				getCurrentPostId() === postId &&
				getCurrentPostType() === postType &&
				!! select( coreStore ).getPostType( postType )?.supports
					?.autosave
			);
		},
		[ postType, postId ]
	);

	if ( ! isReady ) {
		return null;
	}

	return <PostAutosave key={ `${ postType }-${ postId }` } { ...props } />;
}
