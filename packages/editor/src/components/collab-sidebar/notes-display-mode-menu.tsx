import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import type { ComponentProps } from 'react';
import NotesMoreMenuGroup from '../more-menu/notes-more-menu-group';

type MenuShortcut = ComponentProps< typeof Menu.RadioItem >[ 'shortcut' ];
type ModeShortcuts = Record< NotesDisplayMode, MenuShortcut >;

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

const MODE_SHORTCUTS: Record< NotesDisplayMode, string > = {
	hidden: 'core/editor/hide-notes',
	minimized: 'core/editor/minimize-notes',
	full: 'core/editor/expand-notes',
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
	// Each choice advertises its keyboard shortcut alongside the label. The
	// selector memoizes per shortcut name, so the mapped object stays shallow
	// equal between renders.
	const shortcuts = useSelect( ( select ): ModeShortcuts => {
		const { getKeyboardShortcut } = select( keyboardShortcutsStore );
		return {
			hidden: getKeyboardShortcut( MODE_SHORTCUTS.hidden ) ?? undefined,
			minimized:
				getKeyboardShortcut( MODE_SHORTCUTS.minimized ) ?? undefined,
			full: getKeyboardShortcut( MODE_SHORTCUTS.full ) ?? undefined,
		};
	}, [] );

	const choices: { value: NotesDisplayMode; label: string }[] = [
		{ value: 'hidden', label: __( 'Hide notes' ) },
		{ value: 'minimized', label: __( 'Minimize notes' ) },
		{ value: 'full', label: __( 'Expand notes' ) },
	];

	return (
		<NotesMoreMenuGroup>
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
						{ choices.map( ( choice ) => (
							<Menu.RadioItem
								key={ choice.value }
								value={ choice.value }
								shortcut={ shortcuts[ choice.value ] }
								closeOnClick
							>
								<Menu.ItemLabel>
									{ choice.label }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.SubmenuRoot>
		</NotesMoreMenuGroup>
	);
}
