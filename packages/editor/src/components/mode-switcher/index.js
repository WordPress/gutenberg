import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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
	const {
		shortcut,
		isRichEditingEnabled,
		isCodeEditingEnabled,
		codeEditorUnavailableReason,
		mode,
	} = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/editor/toggle-mode' ),
			isRichEditingEnabled:
				select( editorStore ).getEditorSettings().richEditingEnabled,
			isCodeEditingEnabled:
				select( editorStore ).getEditorSettings().codeEditingEnabled,
			/*
			 * Shared with the refusal in `switchEditorMode` so the disabled
			 * item and the notice say the same thing. Private while Suggest
			 * mode is experimental.
			 */
			codeEditorUnavailableReason: unlock(
				select( editorStore )
			).getCodeEditorUnavailableReason(),
			mode: select( editorStore ).getEditorMode(),
		} ),
		[]
	);
	const { switchEditorMode } = useDispatch( editorStore );

	let selectedMode = mode;
	if ( ! isRichEditingEnabled && mode === 'visual' ) {
		selectedMode = 'text';
	}
	if ( ! isCodeEditingEnabled && mode === 'text' ) {
		selectedMode = 'visual';
	}
	// Viewing is a visual-only intent: see `getEditorMode`.
	if ( codeEditorUnavailableReason ) {
		selectedMode = 'visual';
	}

	const choices = MODES.map( ( choice ) => {
		if ( ! isCodeEditingEnabled && choice.value === 'text' ) {
			choice = {
				...choice,
				disabled: true,
			};
		}
		if ( codeEditorUnavailableReason && choice.value === 'text' ) {
			choice = {
				...choice,
				disabled: true,
				info: codeEditorUnavailableReason,
			};
		}
		/*
		 * An intent that forces the visual editor keeps it selectable even
		 * with rich editing turned off — disabling it alongside the code
		 * editor would leave both choices dead and the checked one
		 * unreachable.
		 */
		if (
			! isRichEditingEnabled &&
			! codeEditorUnavailableReason &&
			choice.value === 'visual'
		) {
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
