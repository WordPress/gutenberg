/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	NOTES_FILTER_ALL,
	NOTES_FILTER_UNRESOLVED,
	NOTES_FILTER_RESOLVED,
	NOTES_DENSITY_BALANCED,
	NOTES_DENSITY_COMPACT,
} from './constants';

const { Menu } = unlock( componentsPrivateApis );

export default function NotesAppearancePopover() {
	const { notesFilter, notesDensity } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			notesFilter:
				get( 'core', 'notesFilter' ) || NOTES_FILTER_UNRESOLVED,
			notesDensity:
				get( 'core', 'notesDensity' ) || NOTES_DENSITY_BALANCED,
		};
	}, [] );

	const { set } = useDispatch( preferencesStore );

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
						onChange={ () =>
							set( 'core', 'notesFilter', NOTES_FILTER_ALL )
						}
					>
						<Menu.ItemLabel>{ __( 'All' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem
						name="notesFilter"
						value={ NOTES_FILTER_UNRESOLVED }
						checked={ notesFilter === NOTES_FILTER_UNRESOLVED }
						onChange={ () =>
							set(
								'core',
								'notesFilter',
								NOTES_FILTER_UNRESOLVED
							)
						}
					>
						<Menu.ItemLabel>{ __( 'Unresolved' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem
						name="notesFilter"
						value={ NOTES_FILTER_RESOLVED }
						checked={ notesFilter === NOTES_FILTER_RESOLVED }
						onChange={ () =>
							set( 'core', 'notesFilter', NOTES_FILTER_RESOLVED )
						}
					>
						<Menu.ItemLabel>{ __( 'Resolved' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
				</Menu.Group>
				<Menu.Separator />
				<Menu.Group>
					<Menu.GroupLabel>{ __( 'Density' ) }</Menu.GroupLabel>
					<Menu.RadioItem
						name="notesDensity"
						value={ NOTES_DENSITY_BALANCED }
						checked={ notesDensity === NOTES_DENSITY_BALANCED }
						onChange={ () =>
							set(
								'core',
								'notesDensity',
								NOTES_DENSITY_BALANCED
							)
						}
					>
						<Menu.ItemLabel>{ __( 'Balanced' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem
						name="notesDensity"
						value={ NOTES_DENSITY_COMPACT }
						checked={ notesDensity === NOTES_DENSITY_COMPACT }
						onChange={ () =>
							set( 'core', 'notesDensity', NOTES_DENSITY_COMPACT )
						}
					>
						<Menu.ItemLabel>{ __( 'Compact' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
				</Menu.Group>
			</Menu.Popover>
		</Menu>
	);
}
