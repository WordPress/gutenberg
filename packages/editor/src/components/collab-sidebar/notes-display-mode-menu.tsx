import { speak } from '@wordpress/a11y';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import NotesMoreMenuGroup from '../more-menu/notes-more-menu-group';
import MoreMenuSubmenu from '../more-menu/more-menu-submenu';
import { ALL_NOTES_SIDEBAR, FLOATING_NOTES_SIDEBAR } from './constants';

type NotesDisplayMode = 'full' | 'hidden';

type NotesDisplayModeMenuProps = {
	/**
	 * Whether there are floating notes to show.
	 */
	hasFloatingNotes: boolean;

	/**
	 * Whether the "All notes" sidebar is available.
	 */
	hasAllNotes: boolean;
};

/**
 * Renders the "Notes" submenu of the editor's Options menu, which shows or
 * hides the floating notes and toggles the "All notes" sidebar.
 *
 * @param props                  Component props.
 * @param props.hasFloatingNotes Whether there are floating notes to show.
 * @param props.hasAllNotes      Whether the "All notes" sidebar is available.
 */
export function NotesDisplayModeMenu( {
	hasFloatingNotes,
	hasAllNotes,
}: NotesDisplayModeMenuProps ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { displayMode, isAllNotesOpen } = useSelect( ( select ) => {
		return {
			displayMode:
				select( preferencesStore ).get( 'core', 'notesDisplayMode' ) ===
				'hidden'
					? 'hidden'
					: 'full',
			isAllNotesOpen:
				select( interfaceStore ).getActiveComplementaryArea(
					'core'
				) === ALL_NOTES_SIDEBAR,
		};
	}, [] );
	const { set: setPreference } = useDispatch( preferencesStore );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	if ( ! isLargeViewport && ! hasAllNotes ) {
		return null;
	}

	function setDisplayMode( mode: NotesDisplayMode ) {
		setPreference( 'core', 'notesDisplayMode', mode );
		// Showing notes is an explicit request, so it replaces any open sidebar.
		if ( mode === 'full' && hasFloatingNotes ) {
			enableComplementaryArea( 'core', FLOATING_NOTES_SIDEBAR );
		}
		speak(
			mode === 'hidden' ? __( 'Notes hidden.' ) : __( 'Notes shown.' )
		);
	}

	function toggleAllNotes() {
		if ( isAllNotesOpen ) {
			disableComplementaryArea( 'core' );
		} else {
			enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
		}
	}

	return (
		<NotesMoreMenuGroup.Fill>
			<MoreMenuSubmenu label={ __( 'Notes' ) }>
				{ isLargeViewport && (
					<Menu.RadioGroup
						value={ displayMode }
						onValueChange={ setDisplayMode }
					>
						<Menu.RadioItem value="full" closeOnClick>
							<Menu.ItemLabel>
								{ __( 'Show notes' ) }
							</Menu.ItemLabel>
						</Menu.RadioItem>
						<Menu.RadioItem value="hidden" closeOnClick>
							<Menu.ItemLabel>
								{ __( 'Hide notes' ) }
							</Menu.ItemLabel>
						</Menu.RadioItem>
					</Menu.RadioGroup>
				) }
				{ isLargeViewport && hasAllNotes && <Menu.Separator /> }
				{ hasAllNotes && (
					<Menu.CheckboxItem
						checked={ isAllNotesOpen }
						onCheckedChange={ toggleAllNotes }
					>
						<Menu.ItemLabel>
							{ __( 'Show all notes' ) }
						</Menu.ItemLabel>
					</Menu.CheckboxItem>
				) }
			</MoreMenuSubmenu>
		</NotesMoreMenuGroup.Fill>
	);
}
