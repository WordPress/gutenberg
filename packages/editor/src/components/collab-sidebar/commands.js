/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCommandLoader } from '@wordpress/commands';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { store as interfaceStore } from '@wordpress/interface';
import { comment as commentIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ALL_NOTES_SIDEBAR } from './constants';
import { store as editorStore } from '../../store';
import { useBlockComments } from './hooks';
import { unlock } from '../../lock-unlock';

const getCollabSidebarCommandsLoader = () =>
	/**
	 * Inner hook consumed by useCommandLoader. Returns the "Show/Hide Notes panel"
	 * command, or an empty array when the All Notes panel is not currently
	 * renderable, preventing the command from opening a non-mounted sidebar.
	 *
	 * @return {{ commands: Array<Object>, isLoading: boolean }} An object containing available commands and loading state.
	 */
	function useCollabSidebarCommandsLoader() {
		const isLargeViewport = useViewportMatch( 'medium' );

		const { postId, isNotesAreaOpen } = useSelect( ( select ) => {
			const { getCurrentPostId } = unlock( select( editorStore ) );
			return {
				postId: getCurrentPostId(),
				isNotesAreaOpen:
					select( interfaceStore ).getActiveComplementaryArea(
						'core'
					) === ALL_NOTES_SIDEBAR,
			};
		}, [] );

		const { resultComments } = useBlockComments( postId ?? 0 );

		const { enableComplementaryArea, disableComplementaryArea } =
			useDispatch( interfaceStore );

		// On large viewports with no notes the sidebar isn't rendered, so calling
		// enableComplementaryArea for it would produce no visible result.
		const showFloatingSidebar = isLargeViewport;
		const showAllNotesSidebar =
			resultComments.length > 0 || ! showFloatingSidebar;

		const commands = useMemo( () => {
			if ( ! showAllNotesSidebar && ! isNotesAreaOpen ) {
				return [];
			}

			return [
				{
					name: 'core/toggle-notes-panel',
					label: isNotesAreaOpen
						? __( 'Hide Notes panel' )
						: __( 'Show Notes panel' ),
					searchLabel: __(
						'show hide notes panel annotations comments'
					),
					icon: commentIcon,
					category: 'command',
					callback: ( { close } ) => {
						if ( isNotesAreaOpen ) {
							disableComplementaryArea( 'core' );
						} else {
							enableComplementaryArea(
								'core',
								ALL_NOTES_SIDEBAR
							);
						}
						close();
					},
				},
			];
		}, [
			showAllNotesSidebar,
			isNotesAreaOpen,
			enableComplementaryArea,
			disableComplementaryArea,
		] );

		return {
			commands,
			isLoading: false,
		};
	};

// Registers Notes related commands in the editor command palette.
export function useCollabSidebarCommands() {
	useCommandLoader( {
		name: 'core/editor/collab-sidebar-commands',
		hook: getCollabSidebarCommandsLoader(),
		context: 'block-editor',
	} );
}
