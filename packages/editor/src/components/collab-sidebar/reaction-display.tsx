/**
 * External dependencies
 */
import type { MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { SVG, Path } from '@wordpress/primitives';
import {
	useState,
	useCallback,
	useMemo,
	lazy,
	Suspense,
} from '@wordpress/element';
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
	emojiToHexKey,
	emojiToStorageKey,
	hexKeyToEmoji,
	buildEmojiBySlugMap,
	useReactionEmojis,
} from './reaction-emoji-picker';
import {
	detectLocale,
	loadEmojibaseData,
	useEmojiLabel,
} from './emojibase-data';
import { useFrequentEmojis } from './frequent-emojis';

/**
 * A single slug's entry in the reaction summary: how many reactions it
 * has and whether the current user is among them.
 */
interface ReactionSummaryEntry {
	count: number;
	reacted?: boolean;
}

/**
 * The reaction summary keyed by storage slug (curated slug or hex key).
 */
type ReactionSummary = Record< string, ReactionSummaryEntry >;

/**
 * A comment record as returned by the reactions REST query.
 */
interface ReactionComment {
	author_name: string;
	content: string | { raw?: string; rendered?: string };
}

/**
 * Lazy-load the full emoji picker. Its bundle is only fetched when a
 * user opens the "More emojis" popover for the first time in a session;
 * the Emojibase JSON dataset is fetched separately on first open.
 */
const FullEmojiPicker = lazy( () => import( './emoji-picker' ) );

/**
 * Warm the full picker before it opens: start fetching the lazy picker
 * chunk and the Emojibase dataset for the active locale. Both loaders
 * cache, so calling this repeatedly (every hover) is free after the
 * first invocation.
 */
function prefetchFullPicker(): void {
	import( './emoji-picker' ).catch( () => {} );
	if ( typeof window !== 'undefined' && window.gutenbergEmojibaseUrl ) {
		loadEmojibaseData( window.gutenbergEmojibaseUrl, detectLocale() ).catch(
			() => {}
		);
	}
}

// `Dropdown`'s popover is rendered in a portal anchored to <body>,
// so it escapes the `overflow: hidden` chain on the collab sidebar
// (`.interface-interface-skeleton__sidebar`,
// `.editor-collab-sidebar`, `.editor-collab-sidebar-panel`).
const POPOVER_PROPS = { placement: 'bottom-end' } as const;

/**
 * Get the count of reactions for a specific slug.
 *
 * @param reactions The reactions summary (keyed by slug).
 * @param slug      The reaction slug to count.
 * @return The count of reactions.
 */
function getReactionCount(
	reactions: ReactionSummary | null | undefined,
	slug: string
): number {
	return reactions?.[ slug ]?.count || 0;
}

/**
 * Check if the current user has reacted with a specific slug.
 *
 * @param reactions The reactions summary (keyed by slug).
 * @param slug      The reaction slug to check.
 * @return Whether the user has reacted.
 */
function hasUserReacted(
	reactions: ReactionSummary | null | undefined,
	slug: string
): boolean {
	return reactions?.[ slug ]?.reacted || false;
}

/**
 * Get all reaction slugs that have reactions.
 *
 * @param reactions The reactions summary (keyed by slug).
 * @return Array of slugs with reactions.
 */
function getReactedSlugs(
	reactions: ReactionSummary | null | undefined
): string[] {
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
 * @param names      Array of user display names.
 * @param emojiLabel The emoji label.
 * @return The tooltip text.
 */
function formatReactionTooltip( names: string[], emojiLabel: string ): string {
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
const reactionNamesCache: Record< string, string[] > = {};

interface ReactionButtonProps {
	noteId: number;
	slug: string;
	count: number;
	isActive: boolean;
	emoji: string;
	emojiLabel?: string;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * A single reaction pill button that lazy-loads user names on hover.
 *
 * @param props                  Component props.
 * @param props.noteId           The parent note comment ID.
 * @param props.slug             The emoji slug.
 * @param props.count            The reaction count.
 * @param props.isActive         Whether the current user reacted.
 * @param props.emoji            The emoji character.
 * @param props.emojiLabel       The emoji label, if known (curated reactions
 *                               only).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
function ReactionButton( {
	noteId,
	slug,
	count,
	isActive,
	emoji,
	emojiLabel,
	onToggleReaction,
}: ReactionButtonProps ) {
	const [ tooltipText, setTooltipText ] = useState( '' );
	const [ isFetching, setIsFetching ] = useState( false );
	// Reactions picked from the full picker are stored as hex keys and
	// carry no curated label; resolve their name from the Emojibase
	// dataset so tooltips read "thumbs up" rather than echoing the "👍"
	// character. Falls back to the emoji character until resolved.
	const resolvedLabel = useEmojiLabel( slug, ! emojiLabel );
	const label = emojiLabel || resolvedLabel || emoji;

	const fetchReactionNames = useCallback( () => {
		const cacheKey = `${ noteId }:${ slug }`;
		if ( reactionNamesCache[ cacheKey ] ) {
			setTooltipText(
				formatReactionTooltip( reactionNamesCache[ cacheKey ], label )
			);
			return;
		}

		if ( isFetching ) {
			return;
		}

		setIsFetching( true );
		apiFetch< ReactionComment[] >( {
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
					setTooltipText( formatReactionTooltip( names, label ) );
				}
			} )
			.catch( () => {
				// Silently fall back to count-based label.
			} )
			.finally( () => {
				setIsFetching( false );
			} );
	}, [ noteId, slug, label, isFetching ] );

	const defaultLabel = sprintf(
		/* translators: 1: emoji label, 2: count of reactions */
		_n( '%1$s, %2$d reaction', '%1$s, %2$d reactions', count ),
		label,
		count
	);

	return (
		<Button
			variant="secondary"
			size="small"
			className="editor-collab-sidebar-panel__reaction-button"
			onClick={ ( event: MouseEvent< HTMLElement > ) => {
				event.stopPropagation();
				// When removing the last reaction for this emoji,
				// the button will disappear. Move focus to the
				// parent note to prevent focus loss.
				if ( isActive && count === 1 ) {
					( event.target as HTMLElement )
						.closest< HTMLElement >(
							'.editor-collab-sidebar-panel__thread'
						)
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
			<span className="editor-collab-sidebar-panel__reaction-button-emoji">
				{ emoji }
			</span>
			<span>{ count }</span>
		</Button>
	);
}

interface ReactionDisplayProps {
	noteId: number;
	reactions: ReactionSummary | null | undefined;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param props                  Component props.
 * @param props.noteId           The parent note comment ID.
 * @param props.reactions        The reaction summary (keyed by slug).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
export default function ReactionDisplay( {
	noteId,
	reactions,
	onToggleReaction,
}: ReactionDisplayProps ) {
	// The list is filterable server-side (and static per page load),
	// so index it once per list identity.
	const emojis = useReactionEmojis();
	const emojiBySlug = useMemo(
		() => buildEmojiBySlugMap( emojis ),
		[ emojis ]
	);
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
						emojiLabel={ entry?.label }
						onToggleReaction={ onToggleReaction }
					/>
				);
			} ) }
		</Stack>
	);
}

interface AddReactionButtonProps {
	noteId: number;
	disabled?: boolean;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * Standalone add-reaction button. Opens the curated emoji quick row
 * (5 emoji); its trailing `+` option swaps the popover content to the
 * full searchable picker, so a single trigger covers both.
 *
 * The `+` option only renders when `window.gutenbergEmojibaseUrl` is
 * set — the Gutenberg plugin sets it via PHP, but npm consumers of the
 * editor package must opt in by providing a URL pointing at a
 * self-hosted emojibase dataset.
 *
 * @param props                  Component props.
 * @param props.noteId           The parent note comment ID.
 * @param props.disabled         Whether the button is disabled (e.g. on a
 *                               resolved note thread).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( {
	noteId,
	disabled = false,
	onToggleReaction,
}: AddReactionButtonProps ) {
	const [ isFullPicker, setIsFullPicker ] = useState( false );
	const { recordUse } = useFrequentEmojis();
	const emojis = useReactionEmojis();
	const emojiBySlug = useMemo(
		() => buildEmojiBySlugMap( emojis ),
		[ emojis ]
	);
	const hasFullPicker =
		typeof window !== 'undefined' && !! window.gutenbergEmojibaseUrl;

	return (
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			contentClassName={
				isFullPicker
					? 'editor-collab-sidebar-panel__picker-popover'
					: 'editor-collab-sidebar-panel__add-reaction-popover'
			}
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="small"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ smileyIcon }
					label={ __( 'Add reaction' ) }
					aria-expanded={ isOpen }
					disabled={ disabled }
					accessibleWhenDisabled
					onClick={ () => {
						// Always reopen on the curated quick row.
						setIsFullPicker( false );
						onToggle();
					} }
				/>
			) }
			renderContent={ ( { onClose } ) => {
				const pickReaction = ( slug: string ) => {
					onClose();
					// Invalidate cached tooltip names since adding this
					// reaction changes the set of users for the slug.
					delete reactionNamesCache[ `${ noteId }:${ slug }` ];
					onToggleReaction( slug );
				};

				if ( isFullPicker ) {
					return (
						<Suspense
							fallback={
								<div className="editor-collab-sidebar-panel__picker">
									<div
										className="editor-collab-sidebar-panel__picker-status"
										role="status"
									>
										{ __( 'Loading…' ) }
									</div>
								</div>
							}
						>
							<FullEmojiPicker
								onSelect={ ( emoji ) =>
									pickReaction( emojiToStorageKey( emoji ) )
								}
							/>
						</Suspense>
					);
				}

				return (
					<ReactionEmojiPicker
						onSelect={ ( slug ) => {
							// Count the pick toward the full picker's
							// "Frequently used" section. (The full picker
							// records its own picks.)
							recordUse(
								emojiToHexKey(
									emojiBySlug.get( slug )?.emoji ?? ''
								)
							);
							pickReaction( slug );
						} }
						onMore={
							hasFullPicker
								? () => setIsFullPicker( true )
								: undefined
						}
						// Warm up the picker while the user is still
						// deciding: hovering or focusing the `+` starts
						// loading the lazy picker module and the Emojibase
						// dataset, so the swapped-in view usually renders
						// fully populated.
						onMoreHover={
							hasFullPicker ? prefetchFullPicker : undefined
						}
					/>
				);
			} }
		/>
	);
}
