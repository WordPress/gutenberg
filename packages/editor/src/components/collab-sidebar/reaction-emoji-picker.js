/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Composite } from '@wordpress/components';

/**
 * Curated emoji set for reactions.
 */
export const REACTION_EMOJIS = [
	{ emoji: '👍', label: __( 'Thumbs up' ) },
	{ emoji: '👎', label: __( 'Thumbs down' ) },
	{ emoji: '❤️', label: __( 'Heart' ) },
	{ emoji: '🎉', label: __( 'Celebration' ) },
	{ emoji: '😄', label: __( 'Smile' ) },
	{ emoji: '😕', label: __( 'Confused' ) },
	{ emoji: '👀', label: __( 'Eyes' ) },
	{ emoji: '🚀', label: __( 'Rocket' ) },
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
