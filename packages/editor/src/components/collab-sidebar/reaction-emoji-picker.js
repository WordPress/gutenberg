/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useRef, useCallback } from '@wordpress/element';

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
	const listRef = useRef( null );

	const handleKeyDown = useCallback( ( event, index ) => {
		const buttons = listRef.current?.querySelectorAll( '[role="option"]' );
		if ( ! buttons ) {
			return;
		}

		let nextIndex;

		switch ( event.key ) {
			case 'ArrowRight':
				event.preventDefault();
				nextIndex = ( index + 1 ) % buttons.length;
				buttons[ nextIndex ].focus();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				nextIndex = ( index - 1 + buttons.length ) % buttons.length;
				buttons[ nextIndex ].focus();
				break;
			case 'Home':
				event.preventDefault();
				buttons[ 0 ].focus();
				break;
			case 'End':
				event.preventDefault();
				buttons[ buttons.length - 1 ].focus();
				break;
		}
	}, [] );

	return (
		<div
			ref={ listRef }
			role="listbox"
			aria-label={ __( 'Select an emoji reaction' ) }
			className="editor-collab-sidebar-panel__emoji-picker"
		>
			{ REACTION_EMOJIS.map( ( { emoji, label }, index ) => (
				<Button
					key={ emoji }
					size="compact"
					role="option"
					className="editor-collab-sidebar-panel__emoji-option"
					onClick={ () => onSelect( emoji ) }
					onKeyDown={ ( event ) => handleKeyDown( event, index ) }
					disabled={ disabled }
					accessibleWhenDisabled
					label={ label }
					aria-label={ label }
				>
					{ emoji }
				</Button>
			) ) }
		</div>
	);
}
