/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

/**
 * Set of available mode options.
 *
 * @type {Array}
 */
const MODES = [
	{
		value: 'visual',
		label: __( 'Visual editor' ),
	},
	{
		value: 'text',
		label: __( 'Code editor' ),
	},
];

function ModeSwitcher() {
	const { shortcut, isRichEditingEnabled, isCodeEditingEnabled, mode } =
		useSelect(
			( select ) => ( {
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation( 'core/edit-post/toggle-mode' ),
				isRichEditingEnabled:
					select( editorStore ).getEditorSettings()
						.richEditingEnabled,
				isCodeEditingEnabled:
					select( editorStore ).getEditorSettings()
						.codeEditingEnabled,
				mode: select( editPostStore ).getEditorMode(),
			} ),
			[]
		);
	const { switchEditorMode } = useDispatch( editPostStore );

	let selectedMode = mode;
	if ( ! isRichEditingEnabled && mode === 'visual' ) {
		selectedMode = 'text';
	}
	if ( ! isCodeEditingEnabled && mode === 'text' ) {
		selectedMode = 'visual';
	}

	const choices = MODES.map( ( choice ) => {
		if ( ! isCodeEditingEnabled && choice.value === 'text' ) {
			choice = {
				...choice,
				disabled: true,
			};
		}
		if ( ! isRichEditingEnabled && choice.value === 'visual' ) {
			choice = {
				...choice,
				disabled: true,
				info: __(
					'You can enable the visual editor in your profile settings.'
				),
			};
		}
		if ( choice.value !== selectedMode && ! choice.disabled ) {
			return { ...choice, shortcut };
		}
		return choice;
	} );

	return (
		<MenuGroup label={ __( 'Editor' ) }>
			<MenuItemsChoice
				choices={ choices }
				value={ selectedMode }
				onSelect={ switchEditorMode }
			/>
		</MenuGroup>
	);
}

export default ModeSwitcher;
