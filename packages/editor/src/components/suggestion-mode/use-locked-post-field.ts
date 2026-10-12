/**
 * Read-only treatment for the post settings Suggestion mode cannot propose.
 *
 * The store refuses edits to these fields while suggesting (see
 * `store/suggest-post-edits.ts`); this makes the refusal visible up front,
 * so a control does not open only to refuse what the user picks in it.
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as editorStore } from '../../store';
import { EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { unlock } from '../../lock-unlock';

const UNLOCKED = Object.freeze( {} );

/**
 * Whether the editor is suggesting, so post settings that cannot be
 * proposed are read-only.
 *
 * @return Whether locked post settings are read-only right now.
 */
export function useIsPostSettingLocked(): boolean {
	return useSelect(
		( select ) =>
			// `getEditorIntent` is private while Suggestion mode is experimental.
			unlock( select( editorStore ) ).getEditorIntent() ===
			EDITOR_INTENT_SUGGEST,
		[]
	);
}

/**
 * Props for a post setting's toggle button that disable it while
 * suggesting. Spread them onto a `Button` that has its own `aria-label`:
 * `label` here only feeds the tooltip, and `description` carries the reason
 * to assistive technology without replacing the setting's name.
 *
 * @return Button props, empty while not suggesting.
 */
export function useLockedPostSettingProps(): Record< string, unknown > {
	const isLocked = useIsPostSettingLocked();
	return useMemo( () => {
		if ( ! isLocked ) {
			return UNLOCKED;
		}
		const hint = __(
			'This setting cannot be suggested. Switch to Editing to change it.'
		);
		return {
			disabled: true,
			accessibleWhenDisabled: true,
			description: hint,
			label: hint,
			showTooltip: true,
		};
	}, [ isLocked ] );
}
