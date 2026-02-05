/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';
import { SVG, Circle, Path } from '@wordpress/primitives';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import ReactionEmojiPicker from './reaction-emoji-picker';

/**
 * Smiley face icon for the add-reaction button, inspired by Google Docs.
 */
const smileyIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle
			cx="12"
			cy="12"
			r="10"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<Circle cx="9" cy="10" r="1" fill="currentColor" />
		<Circle cx="15" cy="10" r="1" fill="currentColor" />
		<Path
			d="M8.5 14.5c1 1.5 2.5 2 3.5 2s2.5-.5 3.5-2"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</SVG>
);

/**
 * Get the count of reactions for a specific emoji.
 *
 * @param {Object} reactions The reactions object.
 * @param {string} emoji     The emoji to count.
 * @return {number} The count of reactions.
 */
function getReactionCount( reactions, emoji ) {
	return reactions?.[ emoji ]?.length || 0;
}

/**
 * Check if the current user has reacted with a specific emoji.
 *
 * @param {Object} reactions     The reactions object.
 * @param {string} emoji         The emoji to check.
 * @param {number} currentUserId The current user's ID.
 * @return {boolean} Whether the user has reacted.
 */
function hasUserReacted( reactions, emoji, currentUserId ) {
	return (
		reactions?.[ emoji ]?.some(
			( reaction ) => reaction.userId === currentUserId
		) || false
	);
}

/**
 * Get all emojis that have reactions.
 *
 * @param {Object} reactions The reactions object.
 * @return {string[]} Array of emojis with reactions.
 */
function getReactedEmojis( reactions ) {
	if ( ! reactions ) {
		return [];
	}
	return Object.keys( reactions ).filter(
		( emoji ) => reactions[ emoji ]?.length > 0
	);
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param {Object}   props                  Component props.
 * @param {Object}   props.reactions        The reactions object from comment meta.
 * @param {number}   props.currentUserId    The current user's ID.
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export default function ReactionDisplay( {
	reactions,
	currentUserId,
	onToggleReaction,
} ) {
	const reactedEmojis = getReactedEmojis( reactions );

	if ( reactedEmojis.length === 0 ) {
		return null;
	}

	return (
		<div className="editor-collab-sidebar-panel__reactions">
			{ reactedEmojis.map( ( emoji ) => {
				const count = getReactionCount( reactions, emoji );
				const isActive = hasUserReacted(
					reactions,
					emoji,
					currentUserId
				);

				return (
					<Button
						key={ emoji }
						size="small"
						className={ clsx(
							'editor-collab-sidebar-panel__reaction-button',
							{
								'is-active': isActive,
							}
						) }
						onClick={ ( event ) => {
							event.stopPropagation();
							onToggleReaction( emoji );
						} }
						aria-pressed={ isActive }
						aria-label={ sprintf(
							/* translators: 1: emoji, 2: count of reactions */
							_n(
								'%1$s, %2$d reaction',
								'%1$s, %2$d reactions',
								count
							),
							emoji,
							count
						) }
					>
						<span className="editor-collab-sidebar-panel__reaction-emoji">
							{ emoji }
						</span>
						<span className="editor-collab-sidebar-panel__reaction-count">
							{ count }
						</span>
					</Button>
				);
			} ) }
		</div>
	);
}

/**
 * Standalone add-reaction button with emoji picker dropdown.
 *
 * @param {Object}   props                  Component props.
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( { onToggleReaction } ) {
	return (
		<Dropdown
			className="editor-collab-sidebar-panel__add-reaction-dropdown"
			contentClassName="editor-collab-sidebar-panel__add-reaction-popover"
			popoverProps={ {
				placement: 'bottom-start',
				focusOnMount: 'firstElement',
			} }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="compact"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ smileyIcon }
					onClick={ ( event ) => {
						event.stopPropagation();
						onToggle();
					} }
					aria-expanded={ isOpen }
					label={ __( 'Add reaction' ) }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<ReactionEmojiPicker
					onSelect={ ( emoji ) => {
						onToggleReaction( emoji );
						onClose();
					} }
				/>
			) }
		/>
	);
}
