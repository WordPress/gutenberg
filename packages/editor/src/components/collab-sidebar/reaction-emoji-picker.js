/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Default emoji set for reactions (JS-side fallback).
 * The `value` slug is used as the storage key in the database to avoid
 * potential encoding issues with emoji characters.
 */
export const REACTION_EMOJIS = [
	{ emoji: '❤️', label: __( 'Heart' ), value: 'heart' },
	{ emoji: '🎉', label: __( 'Celebration' ), value: 'celebration' },
	{ emoji: '😄', label: __( 'Smile' ), value: 'smile' },
	{ emoji: '👀', label: __( 'Eyes' ), value: 'eyes' },
	{ emoji: '🚀', label: __( 'Rocket' ), value: 'rocket' },
];

/**
 * Hook that returns the reaction emoji list from editor settings,
 * falling back to the hardcoded REACTION_EMOJIS default.
 *
 * @return {Array} The emoji list.
 */
export function useReactionEmojis() {
	return useSelect( ( select ) => {
		const { noteReactionEmojis } = select( blockEditorStore ).getSettings();
		return noteReactionEmojis?.length
			? noteReactionEmojis
			: REACTION_EMOJIS;
	}, [] );
}

/**
 * Get the emoji character for a given reaction slug.
 *
 * @param {string} slug   The reaction slug.
 * @param {Array}  emojis Optional emoji list to search.
 * @return {string} The emoji character, or the slug if not found.
 */
export function getEmojiBySlug( slug, emojis = REACTION_EMOJIS ) {
	return emojis.find( ( r ) => r.value === slug )?.emoji ?? slug;
}

/**
 * Get the label for a given reaction slug.
 *
 * @param {string} slug   The reaction slug.
 * @param {Array}  emojis Optional emoji list to search.
 * @return {string} The label, or the slug if not found.
 */
export function getLabelBySlug( slug, emojis = REACTION_EMOJIS ) {
	return emojis.find( ( r ) => r.value === slug )?.label ?? slug;
}

/**
 * A selection of emoji buttons for adding reactions.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Callback when an emoji is selected.
 */
export default function ReactionEmojiPicker( { onSelect } ) {
	const emojis = useReactionEmojis();

	return (
		<Composite
			role="listbox"
			aria-label={ __( 'Select an emoji reaction' ) }
			className="editor-collab-sidebar-panel__emoji-picker"
		>
			{ emojis.map( ( { emoji, label, value } ) => (
				<Composite.Item
					key={ value }
					render={
						<Button
							role="option"
							size="compact"
							onClick={ () => onSelect( value ) }
							aria-label={ label }
							className="editor-collab-sidebar-panel__emoji-option"
						/>
					}
				>
					{ emoji }
				</Composite.Item>
			) ) }
		</Composite>
	);
}
