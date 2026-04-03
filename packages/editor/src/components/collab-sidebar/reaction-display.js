/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Button,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { SVG, Path } from '@wordpress/primitives';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ReactionEmojiPicker, {
	getEmojiBySlug,
	getLabelBySlug,
	useReactionEmojis,
} from './reaction-emoji-picker';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Smiley face icon for the add-reaction button.
 */
const smileyIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fill="currentColor"
			d="M14.438 14.15a.75.75 0 0 1 1.124.993A4.742 4.742 0 0 1 12 16.75a4.742 4.742 0 0 1-3.563-1.608.75.75 0 0 1 1.126-.993A3.24 3.24 0 0 0 12 15.251c.97 0 1.84-.425 2.438-1.1ZM9.5 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM14.5 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M12 4a8 8 0 1 1 .001 16.001A8 8 0 0 1 12 4Zm0 1.5a6.5 6.5 0 1 0-.001 13.001A6.5 6.5 0 0 0 12 5.5Z"
			clipRule="evenodd"
		/>
	</SVG>
);

/**
 * Get the count of reactions for a specific slug.
 *
 * @param {Object} reactions The reactions summary (keyed by slug).
 * @param {string} slug      The reaction slug to count.
 * @return {number} The count of reactions.
 */
function getReactionCount( reactions, slug ) {
	return reactions?.[ slug ]?.count || 0;
}

/**
 * Check if the current user has reacted with a specific slug.
 *
 * @param {Object} reactions The reactions summary (keyed by slug).
 * @param {string} slug      The reaction slug to check.
 * @return {boolean} Whether the user has reacted.
 */
function hasUserReacted( reactions, slug ) {
	return reactions?.[ slug ]?.reacted || false;
}

/**
 * Get all reaction slugs that have reactions.
 *
 * @param {Object} reactions The reactions summary (keyed by slug).
 * @return {string[]} Array of slugs with reactions.
 */
function getReactedSlugs( reactions ) {
	if ( ! reactions ) {
		return [];
	}
	return Object.keys( reactions ).filter(
		( slug ) => reactions[ slug ]?.count > 0
	);
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param {Object}   props                  Component props.
 * @param {Object}   props.reactions        The reaction summary (keyed by slug).
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export default function ReactionDisplay( { reactions, onToggleReaction } ) {
	const emojis = useReactionEmojis();
	const reactedSlugs = getReactedSlugs( reactions );

	if ( reactedSlugs.length === 0 ) {
		return null;
	}

	return (
		<HStack spacing="1" justify="flex-start" expanded={ false } wrap>
			{ reactedSlugs.map( ( slug ) => {
				const count = getReactionCount( reactions, slug );
				const isActive = hasUserReacted( reactions, slug );
				const emoji = getEmojiBySlug( slug, emojis );
				const emojiLabel = getLabelBySlug( slug, emojis );

				const buttonLabel = sprintf(
					/* translators: 1: emoji label, 2: count of reactions */
					_n( '%1$s, %2$d reaction', '%1$s, %2$d reactions', count ),
					emojiLabel,
					count
				);

				return (
					<Button
						key={ slug }
						size="small"
						className="editor-collab-sidebar-panel__reaction-button"
						onClick={ ( event ) => {
							event.stopPropagation();
							// When removing the last reaction for this emoji,
							// the button will disappear. Move focus to the
							// parent note to prevent focus loss.
							if ( isActive && count === 1 ) {
								event.target
									.closest(
										'.editor-collab-sidebar-panel__thread'
									)
									?.focus();
							}
							onToggleReaction( slug );
						} }
						isPressed={ isActive }
						label={ buttonLabel }
						showTooltip
					>
						<span>{ emoji }</span>
						<span>{ count }</span>
					</Button>
				);
			} ) }
		</HStack>
	);
}

/**
 * Standalone add-reaction button with emoji picker dropdown.
 *
 * @param {Object}   props                  Component props.
 * @param {boolean}  props.disabled         Whether the button is disabled.
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( { disabled = false, onToggleReaction } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<Menu placement="bottom-end" open={ isOpen } onOpenChange={ setIsOpen }>
			<Menu.TriggerButton
				render={
					<Button
						size="compact"
						className="editor-collab-sidebar-panel__add-reaction-button"
						icon={ smileyIcon }
						label={ __( 'Add reaction' ) }
						disabled={ disabled }
						accessibleWhenDisabled
					/>
				}
			/>
			<Menu.Popover
				modal={ false }
				className="editor-collab-sidebar-panel__add-reaction-popover"
			>
				<ReactionEmojiPicker
					onSelect={ ( slug ) => {
						setIsOpen( false );
						onToggleReaction( slug );
					} }
				/>
			</Menu.Popover>
		</Menu>
	);
}
