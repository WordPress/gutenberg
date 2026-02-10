/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Composite } from '@wordpress/components';

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
 * A selection of emoji buttons for adding reactions.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Callback when an emoji is selected.
 * @param {boolean}  props.disabled Whether the picker is disabled.
 */
export default function ReactionEmojiPicker( { onSelect, disabled = false } ) {
	return (
		<Composite
			role="listbox"
			aria-label={ __( 'Select an emoji reaction' ) }
			className="editor-collab-sidebar-panel__emoji-picker"
		>
			{ REACTION_EMOJIS.map( ( { emoji, label } ) => (
				<Composite.Item
					key={ emoji }
					role="option"
					className="editor-collab-sidebar-panel__emoji-option"
					onClick={ () => onSelect( emoji ) }
					disabled={ disabled }
					accessibleWhenDisabled
					aria-label={ label }
					type="button"
				>
					{ emoji }
				</Composite.Item>
			) ) }
		</Composite>
	);
}
