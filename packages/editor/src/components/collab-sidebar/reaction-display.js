/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { SVG, Path } from '@wordpress/primitives';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import ReactionEmojiPicker, {
	getEmojiBySlug,
	getLabelBySlug,
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
 * @param {Object} reactions The reactions object (keyed by slug).
 * @param {string} slug      The reaction slug to count.
 * @return {number} The count of reactions.
 */
function getReactionCount( reactions, slug ) {
	return reactions?.[ slug ]?.length || 0;
}

/**
 * Check if the current user has reacted with a specific slug.
 *
 * @param {Object} reactions     The reactions object (keyed by slug).
 * @param {string} slug          The reaction slug to check.
 * @param {number} currentUserId The current user's ID.
 * @return {boolean} Whether the user has reacted.
 */
function hasUserReacted( reactions, slug, currentUserId ) {
	return (
		reactions?.[ slug ]?.some(
			( reaction ) => reaction.userId === currentUserId
		) || false
	);
}

/**
 * Get all reaction slugs that have reactions.
 *
 * @param {Object} reactions The reactions object (keyed by slug).
 * @return {string[]} Array of slugs with reactions.
 */
function getReactedSlugs( reactions ) {
	if ( ! reactions ) {
		return [];
	}
	return Object.keys( reactions ).filter(
		( slug ) => reactions[ slug ]?.length > 0
	);
}

/**
 * Generate GitHub-style tooltip text for a reaction.
 *
 * @param {Object} users   Map of user data by ID.
 * @param {Array}  userIds Array of user IDs who reacted.
 * @param {string} slug    The reaction slug.
 * @return {string} The tooltip text.
 */
function getReactionTooltipText( users, userIds, slug ) {
	const names = userIds
		.map( ( id ) => users?.[ id ]?.name )
		.filter( Boolean );

	if ( names.length === 0 ) {
		return '';
	}

	const emojiLabel = getLabelBySlug( slug );

	if ( names.length === 1 ) {
		return sprintf(
			/* translators: 1: user name, 2: emoji label. */
			__( '%1$s reacted with %2$s emoji' ),
			names[ 0 ],
			emojiLabel
		);
	}

	if ( names.length === 2 ) {
		return sprintf(
			/* translators: 1: first user name, 2: second user name, 3: emoji label. */
			__( '%1$s and %2$s reacted with %3$s emoji' ),
			names[ 0 ],
			names[ 1 ],
			emojiLabel
		);
	}

	const othersCount = names.length - 2;
	return sprintf(
		/* translators: 1: first user name, 2: second user name, 3: number of other users, 4: emoji label. */
		_n(
			'%1$s, %2$s, and %3$d other reacted with %4$s emoji',
			'%1$s, %2$s, and %3$d others reacted with %4$s emoji',
			othersCount
		),
		names[ 0 ],
		names[ 1 ],
		othersCount,
		emojiLabel
	);
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param {Object}   props                  Component props.
 * @param {Object}   props.reactions        The reactions object from comment meta.
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export default function ReactionDisplay( { reactions, onToggleReaction } ) {
	const currentUserId = useSelect( ( select ) => {
		const { getCurrentUser } = select( coreStore );
		const user = getCurrentUser();
		return user?.id;
	}, [] );
	const reactedSlugs = getReactedSlugs( reactions );

	// Collect all unique user IDs from reactions.
	const userIdArray = useMemo( () => {
		if ( ! reactions ) {
			return [];
		}
		const userIdSet = new Set();
		Object.values( reactions ).forEach( ( reactionList ) => {
			reactionList?.forEach( ( reaction ) => {
				if ( reaction.userId ) {
					userIdSet.add( reaction.userId );
				}
			} );
		} );
		return Array.from( userIdSet ).sort( ( a, b ) => a - b );
	}, [ reactions ] );

	// Fetch user data for all users who reacted.
	const users = useSelect(
		( select ) => {
			if ( ! userIdArray.length ) {
				return {};
			}
			const { getUsers } = select( coreStore );
			const userList = getUsers( {
				include: userIdArray,
				context: 'view',
				_fields: 'id,name',
				per_page: -1,
			} );
			if ( ! userList ) {
				return {};
			}
			const userData = {};
			userList.forEach( ( user ) => {
				userData[ user.id ] = user;
			} );
			return userData;
		},
		[ userIdArray ]
	);

	if ( reactedSlugs.length === 0 ) {
		return null;
	}

	return (
		<div className="editor-collab-sidebar-panel__reactions">
			{ reactedSlugs.map( ( slug ) => {
				const count = getReactionCount( reactions, slug );
				const isActive = hasUserReacted(
					reactions,
					slug,
					currentUserId
				);
				const emoji = getEmojiBySlug( slug );

				const reactionUserIds = ( reactions?.[ slug ] || [] ).map(
					( r ) => r.userId
				);
				const tooltipText = getReactionTooltipText(
					users,
					reactionUserIds,
					slug
				);

				// Use tooltip text when user data is loaded, otherwise fall back to basic label.
				const buttonLabel = tooltipText
					? tooltipText
					: sprintf(
							/* translators: 1: emoji, 2: count of reactions */
							_n(
								'%1$s, %2$d reaction',
								'%1$s, %2$d reactions',
								count
							),
							emoji,
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
