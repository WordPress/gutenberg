import { Button } from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';
import {
	NOTES_FILTER_ALL,
	NOTES_FILTER_UNRESOLVED,
	NOTES_FILTER_RESOLVED,
} from './constants';

/**
 * Menu in the "All notes" sidebar header for choosing which notes the list shows.
 *
 * @param {Object}                   props
 * @param {string}                   props.notesFilter    Active filter, one of the `NOTES_FILTER_*` constants.
 * @param {(filter: string) => void} props.setNotesFilter Sets the active filter.
 */
export function NotesAppearancePopover( { notesFilter, setNotesFilter } ) {
	return (
		<Menu.Root
			// Let outside interactions reach the note thread's focus-out
			// handling so it can clear the selection.
			modal={ false }
		>
			<Menu.Trigger
				render={
					<Button
						size="compact"
						icon={ cog }
						label={ __( 'Appearance' ) }
						className="editor-collab-sidebar__appearance-button"
					/>
				}
			/>
			<Menu.Popup
				positioner={ <Menu.Positioner side="bottom" align="end" /> }
			>
				<Menu.RadioGroup
					value={ notesFilter }
					onValueChange={ setNotesFilter }
				>
					<Menu.GroupLabel>{ __( 'Notes' ) }</Menu.GroupLabel>
					<Menu.RadioItem value={ NOTES_FILTER_ALL }>
						<Menu.ItemLabel>{ __( 'All' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem value={ NOTES_FILTER_UNRESOLVED }>
						<Menu.ItemLabel>{ __( 'Unresolved' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem value={ NOTES_FILTER_RESOLVED }>
						<Menu.ItemLabel>{ __( 'Resolved' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.Root>
	);
}
