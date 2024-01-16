/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

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

function ModeSwitcher( {
	shortcut,
	isCodeEditingEnabled = true,
	isRichEditingEnabled = true,
} ) {
	const { mode } = useSelect(
		( select ) => ( {
			mode:
				select( preferencesStore ).get( 'core', 'editorMode' ) ??
				'visual',
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
				value={ mode }
				onSelect={ switchEditorMode }
			/>
		</MenuGroup>
	);
}

export default ModeSwitcher;
