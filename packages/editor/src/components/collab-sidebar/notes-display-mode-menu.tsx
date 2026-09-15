import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import type { ComponentProps } from 'react';
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

const CHOICES: {
	value: NotesDisplayMode;
	label: string;
	shortcutName: string;
}[] = [
	{
		value: 'hidden',
		label: __( 'Hide notes' ),
		shortcutName: 'core/editor/hide-notes',
	},
	{
		value: 'minimized',
		label: __( 'Minimize notes' ),
		shortcutName: 'core/editor/minimize-notes',
	},
	{
		value: 'full',
		label: __( 'Expand notes' ),
		shortcutName: 'core/editor/expand-notes',
	},
];

type NotesDisplayModeItemProps = {
	value: NotesDisplayMode;
	label: string;
	shortcutName: string;
};

/**
 * Renders one display-mode choice, advertising its keyboard shortcut
 * alongside the label.
 *
 * @param props              Component props.
 * @param props.value        The display mode the choice selects.
 * @param props.label        The label of the choice.
 * @param props.shortcutName The registered shortcut that selects the mode.
 */
function NotesDisplayModeItem( {
	value,
	label,
	shortcutName,
}: NotesDisplayModeItemProps ) {
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getKeyboardShortcut(
				shortcutName
			),
		[ shortcutName ]
	);

	return (
		<Menu.RadioItem
			value={ value }
			shortcut={
				( shortcut ?? undefined ) as ComponentProps<
					typeof Menu.RadioItem
				>[ 'shortcut' ]
			}
			closeOnClick
		>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
		</Menu.RadioItem>
	);
}

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
	return (
		<NotesMoreMenuGroup.Fill>
			<Menu.SubmenuRoot>
				<Menu.SubmenuTrigger
					prefix={ <Menu.PrefixIcon icon={ commentIcon } /> }
				>
					<Menu.ItemLabel>{ __( 'Notes' ) }</Menu.ItemLabel>
				</Menu.SubmenuTrigger>
				<Menu.Popup>
					<Menu.RadioGroup
						value={ value }
						onValueChange={ ( mode ) =>
							onChange( mode as NotesDisplayMode )
						}
					>
						{ CHOICES.map( ( choice ) => (
							<NotesDisplayModeItem
								key={ choice.value }
								{ ...choice }
							/>
						) ) }
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.SubmenuRoot>
		</NotesMoreMenuGroup.Fill>
	);
}
