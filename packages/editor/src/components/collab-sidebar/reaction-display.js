/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { smiley as smileyIcon, plus as plusIcon } from '@wordpress/icons';
import { useState, useCallback, lazy, Suspense } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import ReactionEmojiPicker, {
	emojiToStorageKey,
	getEmojiBySlug,
	getLabelBySlug,
	useReactionEmojis,
} from './reaction-emoji-picker';
import { unlock } from '../../lock-unlock';

/**
 * Lazy-load the Frimousse-based full picker. Its bundle (Frimousse +
 * the bundled Emojibase JSON) is only fetched when a user opens the
 * "More emojis" popover for the first time in a session.
 */
const FrimoussePicker = lazy( () => import( './frimousse-picker' ) );

const { Menu } = unlock( componentsPrivateApis );

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
 * Generate GitHub-style tooltip text from user names.
 *
 * @param {string[]} names      Array of user display names.
 * @param {string}   emojiLabel The emoji label.
 * @return {string} The tooltip text.
 */
function formatReactionTooltip( names, emojiLabel ) {
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

// Module-level cache for reaction details: { "noteId:slug": string[] }
const reactionNamesCache = {};

/**
 * A single reaction pill button that lazy-loads user names on hover.
 *
 * @param {Object}   props                  Component props.
 * @param {number}   props.noteId           The parent note comment ID.
 * @param {string}   props.slug             The emoji slug.
 * @param {number}   props.count            The reaction count.
 * @param {boolean}  props.isActive         Whether the current user reacted.
 * @param {string}   props.emoji            The emoji character.
 * @param {string}   props.emojiLabel       The emoji label.
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
function ReactionButton( {
	noteId,
	slug,
	count,
	isActive,
	emoji,
	emojiLabel,
	onToggleReaction,
} ) {
	const [ tooltipText, setTooltipText ] = useState( '' );
	const [ isFetching, setIsFetching ] = useState( false );

	const fetchReactionNames = useCallback( () => {
		const cacheKey = `${ noteId }:${ slug }`;
		if ( reactionNamesCache[ cacheKey ] ) {
			setTooltipText(
				formatReactionTooltip(
					reactionNamesCache[ cacheKey ],
					emojiLabel
				)
			);
			return;
		}

		if ( isFetching ) {
			return;
		}

		setIsFetching( true );
		apiFetch( {
			path: addQueryArgs( '/wp/v2/comments', {
				parent: noteId,
				type: 'reaction',
				status: 'all',
				per_page: 100,
				_fields: 'author_name,content',
			} ),
		} )
			.then( ( reactions ) => {
				const names = reactions
					.filter( ( r ) => {
						const content =
							typeof r.content === 'object'
								? r.content?.raw || r.content?.rendered
								: r.content;
						const clean = content
							?.replace?.( /<[^>]*>/g, '' )
							?.trim();
						return clean === slug;
					} )
					.map( ( r ) => r.author_name );

				reactionNamesCache[ cacheKey ] = names;
				if ( names.length > 0 ) {
					setTooltipText(
						formatReactionTooltip( names, emojiLabel )
					);
				}
			} )
			.catch( () => {
				// Silently fall back to count-based label.
			} )
			.finally( () => {
				setIsFetching( false );
			} );
	}, [ noteId, slug, emojiLabel, isFetching ] );

	const defaultLabel = sprintf(
		/* translators: 1: emoji label, 2: count of reactions */
		_n( '%1$s, %2$d reaction', '%1$s, %2$d reactions', count ),
		emojiLabel,
		count
	);

	return (
		<Button
			size="small"
			className="editor-collab-sidebar-panel__reaction-button"
			onClick={ ( event ) => {
				event.stopPropagation();
				// When removing the last reaction for this emoji,
				// the button will disappear. Move focus to the
				// parent note to prevent focus loss.
				if ( isActive && count === 1 ) {
					event.target
						.closest( '.editor-collab-sidebar-panel__thread' )
						?.focus();
				}
				// Invalidate cached names since the reaction set is changing.
				delete reactionNamesCache[ `${ noteId }:${ slug }` ];
				onToggleReaction( slug );
			} }
			onMouseEnter={ fetchReactionNames }
			onFocus={ fetchReactionNames }
			isPressed={ isActive }
			label={ tooltipText || defaultLabel }
			showTooltip
		>
			<span>{ emoji }</span>
			<span>{ count }</span>
		</Button>
	);
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param {Object}   props                  Component props.
 * @param {number}   props.noteId           The parent note comment ID.
 * @param {Object}   props.reactions        The reaction summary (keyed by slug).
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export default function ReactionDisplay( {
	noteId,
	reactions,
	onToggleReaction,
} ) {
	const emojis = useReactionEmojis();
	const reactedSlugs = getReactedSlugs( reactions );

	if ( reactedSlugs.length === 0 ) {
		return null;
	}

	return (
		<Stack direction="row" gap="xs" justify="flex-start" wrap="wrap">
			{ reactedSlugs.map( ( slug ) => {
				const count = getReactionCount( reactions, slug );
				const isActive = hasUserReacted( reactions, slug );

				return (
					<ReactionButton
						key={ slug }
						noteId={ noteId }
						slug={ slug }
						count={ count }
						isActive={ isActive }
						emoji={ getEmojiBySlug( slug, emojis ) }
						emojiLabel={ getLabelBySlug( slug, emojis ) }
						onToggleReaction={ onToggleReaction }
					/>
				);
			} ) }
		</Stack>
	);
}

/**
 * Standalone add-reaction button with the curated emoji picker
 * dropdown (the 5-emoji quick row).
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

/**
 * Standalone "+" button that opens a full Frimousse-based emoji picker.
 * Sibling of AddReactionButton; not nested inside it so the curated and
 * full picker popovers never conflict.
 *
 * @param {Object}   props                  Component props.
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export function MoreEmojiButton( { onToggleReaction } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const emojis = useReactionEmojis();
	return (
		<Menu placement="bottom-end" open={ isOpen } onOpenChange={ setIsOpen }>
			<Menu.TriggerButton
				render={
					<Button
						size="compact"
						className="editor-collab-sidebar-panel__add-reaction-button"
						icon={ plusIcon }
						label={ __( 'More emojis' ) }
					/>
				}
			/>
			<Menu.Popover
				modal={ false }
				className="editor-collab-sidebar-panel__frimousse-popover"
			>
				<Suspense fallback={ null }>
					<FrimoussePicker
						onSelect={ ( emoji ) => {
							setIsOpen( false );
							onToggleReaction(
								emojiToStorageKey( emoji, emojis )
							);
						} }
					/>
				</Suspense>
			</Menu.Popover>
		</Menu>
	);
}
