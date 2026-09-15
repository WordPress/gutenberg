import { __ } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import MoreMenuSubmenu from '../more-menu/more-menu-submenu';
import NotesMoreMenuGroup from '../more-menu/notes-more-menu-group';

/**
 * How the floating notes render in the canvas: full threads, minimized
 * avatar pills, or nothing.
 */
export type NotesDisplayMode = 'full' | 'minimized' | 'hidden';

type NotesDisplayModeMenuProps = {
	/** The active display mode. */
	value: NotesDisplayMode;
	/** Called with the display mode the user picks. */
	onChange: ( value: NotesDisplayMode ) => void;
};

/**
 * Renders the "Notes" submenu of the editor's Options menu, which holds the
 * display-mode choices for the floating notes.
 *
 * @param props          Component props.
 * @param props.value    The active display mode.
 * @param props.onChange Called with the display mode the user picks.
 */
export function NotesDisplayModeMenu( {
	value,
	onChange,
}: NotesDisplayModeMenuProps ) {
	const choices: { value: NotesDisplayMode; label: string }[] = [
		{ value: 'hidden', label: __( 'Hide notes' ) },
		{ value: 'minimized', label: __( 'Minimize notes' ) },
		{ value: 'full', label: __( 'Expand notes' ) },
	];

	return (
		<NotesMoreMenuGroup.Fill>
			<MoreMenuSubmenu icon={ commentIcon } label={ __( 'Notes' ) }>
				<Menu.RadioGroup
					value={ value }
					onValueChange={ ( mode ) =>
						onChange( mode as NotesDisplayMode )
					}
				>
					{ choices.map( ( choice ) => (
						<Menu.RadioItem
							key={ choice.value }
							value={ choice.value }
							closeOnClick
						>
							<Menu.ItemLabel>{ choice.label }</Menu.ItemLabel>
						</Menu.RadioItem>
					) ) }
				</Menu.RadioGroup>
			</MoreMenuSubmenu>
		</NotesMoreMenuGroup.Fill>
	);
}
