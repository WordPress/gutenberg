import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { getKeyboardShortcut } from '../../utils/keyboard-shortcut';

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
	const { keyCombination, isRichEditingEnabled, isCodeEditingEnabled, mode } =
		useSelect(
			( select ) => ( {
				keyCombination: select(
					keyboardShortcutsStore
				).getShortcutKeyCombination( 'core/editor/toggle-mode' ),
				isRichEditingEnabled:
					select( editorStore ).getEditorSettings()
						.richEditingEnabled,
				isCodeEditingEnabled:
					select( editorStore ).getEditorSettings()
						.codeEditingEnabled,
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

	const shortcut = getKeyboardShortcut( keyCombination );
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
		<Menu.RadioGroup
			value={ selectedMode }
			onValueChange={ ( value ) => switchEditorMode( value ) }
		>
			<Menu.Group>
				<Menu.GroupLabel>{ __( 'Editor' ) }</Menu.GroupLabel>
				{ choices.map( ( choice ) => (
					<Menu.RadioItem
						key={ choice.value }
						value={ choice.value }
						disabled={ choice.disabled }
						shortcut={ choice.shortcut }
					>
						<Menu.ItemLabel>{ choice.label }</Menu.ItemLabel>
						{ choice.info && (
							<Menu.ItemDescription>
								{ choice.info }
							</Menu.ItemDescription>
						) }
					</Menu.RadioItem>
				) ) }
			</Menu.Group>
		</Menu.RadioGroup>
	);
}

export default ModeSwitcher;
