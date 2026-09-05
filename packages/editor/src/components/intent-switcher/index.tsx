import type { ComponentProps } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	EDITOR_INTENT_EDIT,
	EDITOR_INTENT_SUGGEST,
	EDITOR_INTENT_VIEW,
} from '../../store/constants';
import { getKeyboardShortcut } from '../../utils/keyboard-shortcut';
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Available editor intent options surfaced in the more-menu mode picker.
 *
 * Each option is mirrored across three files; keep them in sync when adding
 * or renaming an intent:
 *   - This file: UI label, description, and shortcut hint.
 *   - `../global-keyboard-shortcuts/register-shortcuts.js`: registers the
 *     keyboard binding with `@wordpress/keyboard-shortcuts`.
 *   - `../global-keyboard-shortcuts/index.js`: wires `useShortcut` so the
 *     binding dispatches `setEditorIntent`.
 *
 * The `value` field must be one of the `EDITOR_INTENT_*` constants — the
 * `setEditorIntent` action validates against `EDITOR_INTENTS` and silently
 * ignores unknown values.
 */
type KeyboardShortcut = NonNullable<
	ComponentProps< typeof Menu.RadioItem >[ 'shortcut' ]
>;

// `getKeyboardShortcut` is untyped JavaScript; its result is the `Menu`
// component's shortcut shape.
function intentShortcut( character: string ): KeyboardShortcut {
	return getKeyboardShortcut( {
		character,
		modifier: 'secondary',
	} ) as KeyboardShortcut;
}

const INTENTS: Array< {
	value: string;
	label: string;
	info: string;
	shortcut: KeyboardShortcut | null;
} > = [
	{
		value: EDITOR_INTENT_EDIT,
		label: __( 'Editing' ),
		info: __( 'Edit content directly.' ),
		shortcut: intentShortcut( 'z' ),
	},
	{
		value: EDITOR_INTENT_SUGGEST,
		label: __( 'Suggesting' ),
		info: __( 'Propose changes the author can apply or reject.' ),
		shortcut: intentShortcut( 'x' ),
	},
	{
		value: EDITOR_INTENT_VIEW,
		label: __( 'Viewing' ),
		info: __( 'Read-only preview of the content.' ),
		shortcut: intentShortcut( 'c' ),
	},
];

/**
 * Editor intent switcher. Lets the user pick between direct editing,
 * suggesting changes, or viewing in read-only. Only rendered for post
 * types that declare the `editor.notes` support.
 */
function IntentSwitcher() {
	// The intent API is private while Suggest mode is experimental.
	const { intent, isRichEditingEnabled } = useSelect(
		( select ) => ( {
			intent: unlock( select( editorStore ) ).getEditorIntent(),
			isRichEditingEnabled:
				// @ts-expect-error Editor settings are typed as a bare `Object`.
				select( editorStore ).getEditorSettings().richEditingEnabled,
		} ),
		[]
	);
	const { setEditorIntent } = unlock( useDispatch( editorStore ) );

	/*
	 * Two adjustments per choice.
	 *
	 * The active choice hides its shortcut. The menu renders the selection as
	 * a checked radio with the label; a key hint next to it reads as "press
	 * this to get where you already are". `ModeSwitcher` drops the shortcut
	 * from the selected mode for the same reason.
	 *
	 * Suggesting is visual-only - a suggestion is an inline marker in block
	 * content, which the code editor cannot render - so it is unavailable to
	 * a user who turned the visual editor off. `setEditorIntent` refuses it
	 * either way; offering it disabled, with the setting to change, beats a
	 * choice that looks live and then declines.
	 */
	const choices = INTENTS.map( ( choice ) => {
		const base =
			choice.value === intent ? { ...choice, shortcut: null } : choice;

		if (
			choice.value === EDITOR_INTENT_SUGGEST &&
			! isRichEditingEnabled
		) {
			return {
				...base,
				disabled: true,
				info: __(
					'You can enable the visual editor in your profile settings.'
				),
			};
		}

		return { ...base, disabled: false };
	} );

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<Menu.RadioGroup
				value={ intent }
				onValueChange={ ( value ) => setEditorIntent( value ) }
			>
				<Menu.Group>
					<Menu.GroupLabel>{ __( 'Mode' ) }</Menu.GroupLabel>
					{ choices.map( ( choice ) => (
						<Menu.RadioItem
							key={ choice.value }
							value={ choice.value }
							disabled={ choice.disabled }
							shortcut={ choice.shortcut ?? undefined }
						>
							<Menu.ItemLabel>{ choice.label }</Menu.ItemLabel>
							<Menu.ItemDescription>
								{ choice.info }
							</Menu.ItemDescription>
						</Menu.RadioItem>
					) ) }
				</Menu.Group>
			</Menu.RadioGroup>
			<Menu.Separator />
		</PostTypeSupportCheck>
	);
}

export default IntentSwitcher;
