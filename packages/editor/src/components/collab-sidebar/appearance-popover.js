/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	NOTES_FILTER_ALL,
	NOTES_FILTER_UNRESOLVED,
	NOTES_FILTER_RESOLVED,
} from './constants';

const { Menu } = unlock( componentsPrivateApis );

export default function NotesAppearancePopover( {
	notesFilter,
	setNotesFilter,
} ) {
	return (
		<Menu placement="bottom-end">
			<Menu.TriggerButton
				render={
					<Button
						size="compact"
						icon={ cog }
						label={ __( 'Appearance' ) }
						className="editor-collab-sidebar__appearance-button"
					/>
				}
			/>
			<Menu.Popover modal={ false }>
				<Menu.Group>
					<Menu.GroupLabel>{ __( 'Notes' ) }</Menu.GroupLabel>
					<Menu.RadioItem
						name="notesFilter"
						value={ NOTES_FILTER_ALL }
						checked={ notesFilter === NOTES_FILTER_ALL }
						onChange={ () => setNotesFilter( NOTES_FILTER_ALL ) }
					>
						<Menu.ItemLabel>{ __( 'All' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem
						name="notesFilter"
						value={ NOTES_FILTER_UNRESOLVED }
						checked={ notesFilter === NOTES_FILTER_UNRESOLVED }
						onChange={ () =>
							setNotesFilter( NOTES_FILTER_UNRESOLVED )
						}
					>
						<Menu.ItemLabel>{ __( 'Unresolved' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem
						name="notesFilter"
						value={ NOTES_FILTER_RESOLVED }
						checked={ notesFilter === NOTES_FILTER_RESOLVED }
						onChange={ () =>
							setNotesFilter( NOTES_FILTER_RESOLVED )
						}
					>
						<Menu.ItemLabel>{ __( 'Resolved' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
				</Menu.Group>
			</Menu.Popover>
		</Menu>
	);
}
