/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';

/**
 * Curated emoji set for reactions.
 * The `value` slug is used as the storage key in the database to avoid
 * potential encoding issues with emoji characters.
 */
export const REACTION_EMOJIS = [
	{ emoji: '👍', label: __( 'Thumbs up' ), value: 'thumbs-up' },
	{ emoji: '🤔', label: __( 'Thinking' ), value: 'thinking' },
	{ emoji: '❤️', label: __( 'Heart' ), value: 'heart' },
	{ emoji: '🎉', label: __( 'Celebration' ), value: 'celebration' },
	{ emoji: '😄', label: __( 'Smile' ), value: 'smile' },
	{ emoji: '😕', label: __( 'Confused' ), value: 'confused' },
	{ emoji: '👀', label: __( 'Eyes' ), value: 'eyes' },
	{ emoji: '🚀', label: __( 'Rocket' ), value: 'rocket' },
];

/**
 * Get the emoji character for a given reaction slug.
 *
 * @param {string} slug The reaction slug.
 * @return {string} The emoji character, or the slug if not found.
 */
export function getEmojiBySlug( slug ) {
	return REACTION_EMOJIS.find( ( r ) => r.value === slug )?.emoji ?? slug;
}

/**
 * Get the label for a given reaction slug.
 *
 * @param {string} slug The reaction slug.
 * @return {string} The label, or the slug if not found.
 */
export function getLabelBySlug( slug ) {
	return REACTION_EMOJIS.find( ( r ) => r.value === slug )?.label ?? slug;
}

/**
 * A selection of emoji buttons for adding reactions.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Callback when an emoji is selected.
 * @return {WPElement} The ReactionEmojiPicker component.
 */
export default function ReactionEmojiPicker( { onSelect } ) {
	return (
		<Composite
			role="listbox"
			aria-label={ __( 'Select an emoji reaction' ) }
			className="editor-collab-sidebar-panel__emoji-picker"
		>
			{ REACTION_EMOJIS.map( ( { emoji, label, value } ) => (
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
