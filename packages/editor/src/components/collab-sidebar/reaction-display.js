/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { SVG, Path } from '@wordpress/primitives';
import { plus as plusIcon } from '@wordpress/icons';
import { useState, useCallback, lazy, Suspense } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

// Inlined while reactions remain experimental in scope. If/when this
// icon is needed elsewhere it can be promoted to `@wordpress/icons`.
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
 * Internal dependencies
 */
import ReactionEmojiPicker, {
	emojiToStorageKey,
	hexKeyToEmoji,
	buildEmojiBySlugMap,
} from './reaction-emoji-picker';

/**
 * Lazy-load the full emoji picker. Its bundle is only fetched when a
 * user opens the "More emojis" popover for the first time in a session;
 * the Emojibase JSON dataset is fetched separately on first open.
 */
const FullEmojiPicker = lazy( () => import( './emoji-picker' ) );

// The curated emoji set is static, so index it once at module load.
const emojiBySlug = buildEmojiBySlugMap();

// `Dropdown`'s popover is rendered in a portal anchored to <body>,
// so it escapes the `overflow: hidden` chain on the collab sidebar
// (`.interface-interface-skeleton__sidebar`,
// `.editor-collab-sidebar`, `.editor-collab-sidebar-panel`).
const POPOVER_PROPS = { placement: 'bottom-end' };

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
	const reactedSlugs = getReactedSlugs( reactions );

	if ( reactedSlugs.length === 0 ) {
		return null;
	}

	return (
		<Stack direction="row" gap="xs" justify="flex-start" wrap="wrap">
			{ reactedSlugs.map( ( slug ) => {
				const count = getReactionCount( reactions, slug );
				const isActive = hasUserReacted( reactions, slug );
				const entry = emojiBySlug.get( slug );

				return (
					<ReactionButton
						key={ slug }
						noteId={ noteId }
						slug={ slug }
						count={ count }
						isActive={ isActive }
						emoji={ entry?.emoji ?? hexKeyToEmoji( slug ) }
						emojiLabel={ entry?.label ?? hexKeyToEmoji( slug ) }
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
 * @param {boolean}  props.disabled         Whether the button is disabled
 *                                          (e.g. on a resolved note thread).
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( { disabled = false, onToggleReaction } ) {
	return (
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			contentClassName="editor-collab-sidebar-panel__add-reaction-popover"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="small"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ smileyIcon }
					iconSize={ 20 }
					label={ __( 'Add reaction' ) }
					aria-expanded={ isOpen }
					disabled={ disabled }
					accessibleWhenDisabled
					onClick={ onToggle }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<ReactionEmojiPicker
					onSelect={ ( slug ) => {
						onClose();
						onToggleReaction( slug );
					} }
				/>
			) }
		/>
	);
}

/**
 * Standalone "+" button that opens the full emoji picker. Sibling of
 * AddReactionButton; not nested inside it so the curated and full picker
 * popovers never conflict.
 *
 * Renders nothing when `window.gutenbergEmojibaseUrl` is unset — the
 * Gutenberg plugin sets it via PHP, but npm consumers of @wordpress/editor
 * must opt in by providing a URL pointing at a self-hosted emojibase
 * dataset.
 *
 * @param {Object}   props                  Component props.
 * @param {Function} props.onToggleReaction Callback to toggle a reaction.
 */
export function MoreEmojiButton( { onToggleReaction } ) {
	if ( typeof window === 'undefined' || ! window.gutenbergEmojibaseUrl ) {
		return null;
	}
	return (
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			contentClassName="editor-collab-sidebar-panel__picker-popover"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="compact"
					className="editor-collab-sidebar-panel__more-reaction-button"
					icon={ plusIcon }
					label={ __( 'More emojis' ) }
					aria-expanded={ isOpen }
					onClick={ onToggle }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<Suspense fallback={ null }>
					<FullEmojiPicker
						onSelect={ ( emoji ) => {
							onClose();
							onToggleReaction( emojiToStorageKey( emoji ) );
						} }
					/>
				</Suspense>
			) }
		/>
	);
}
