import type { MouseEvent, ReactNode } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Dropdown } from '@wordpress/components';
// `Button` and `IconButton` are not yet on the recommended list while the
// Design System reviews their consistency alongside `@wordpress/components`
// (see WordPress/gutenberg#76135). They are used here deliberately: the
// reaction row needs the Design System's pill shape and quiet neutral
// treatment rather than a bespoke stylesheet.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, IconButton, Stack, Tooltip } from '@wordpress/ui';
import { reaction as reactionIcon } from '@wordpress/icons';
import { useState, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import ReactionEmojiPicker, {
	buildEmojiBySlugMap,
	useReactionEmojis,
} from './reaction-emoji-picker';

interface ReactionSummaryEntry {
	count: number;
	reacted?: boolean;
	// The current user's reaction comment ID, used to delete it again.
	my_reaction_id?: number;
}

/**
 * The reaction summary keyed by storage slug.
 */
type ReactionSummary = Record< string, ReactionSummaryEntry >;

/**
 * A comment record as returned by the reactions REST query.
 */
interface ReactionComment {
	author_name: string;
	content: string | { raw?: string; rendered?: string };
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
export function getReactedSlugs(
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

const REACTIONS_PER_PAGE = 100;

// A note with more reactions than this is not worth walking page by page just
// to name them; the pill falls back to its count-based label instead.
const MAX_REACTION_PAGES = 10;

/**
 * Fetches every reaction on a note, across every emoji.
 *
 * The REST collection cannot be filtered by reaction slug, so the whole set
 * has to come back before it can be grouped. Walks the pages rather than
 * reading only the first one, which would drop reactors on a busy note.
 *
 * @param noteId The parent note comment ID.
 * @return All reactions on the note, or `null` if there are more than the
 *         walk is willing to fetch.
 */
async function fetchNoteReactions(
	noteId: number
): Promise< ReactionComment[] | null > {
	const reactions: ReactionComment[] = [];

	for ( let page = 1; page <= MAX_REACTION_PAGES; page++ ) {
		const batch = await apiFetch< ReactionComment[] >( {
			path: addQueryArgs( '/wp/v2/comments', {
				parent: noteId,
				type: 'reaction',
				status: 'all',
				page,
				per_page: REACTIONS_PER_PAGE,
				_fields: 'author_name,content',
			} ),
		} );

		reactions.push( ...batch );

		if ( batch.length < REACTIONS_PER_PAGE ) {
			return reactions;
		}
	}

	return null;
}

// Module-level cache for reaction details: { "noteId:slug": string[] }
const reactionNamesCache: Record< string, string[] > = {};

interface ReactionButtonProps {
	noteId: number;
	slug: string;
	count: number;
	isActive: boolean;
	emoji: string;
	emojiLabel: string;
	disabled?: boolean;
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
 * @param props.emojiLabel       The emoji label.
 * @param props.disabled         Whether the reaction can no longer be toggled
 *                               (the thread is resolved).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
function ReactionButton( {
	noteId,
	slug,
	count,
	isActive,
	emoji,
	emojiLabel,
	disabled = false,
	onToggleReaction,
}: ReactionButtonProps ) {
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
		fetchNoteReactions( noteId )
			.then( ( reactions ) => {
				// A truncated walk would drop reactors, and a partial name
				// list reads as complete. Keep the count-based label instead.
				if ( ! reactions ) {
					return;
				}

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

	const accessibleLabel = tooltipText || defaultLabel;

	return (
		// Per the design, a reaction someone else left is quiet text with no
		// border or fill, and the current user's own is the brand outline:
		// a blue ring and count on a transparent pill. Neither variant
		// carries a solid fill, so a row of pills never reads as a dark bar
		// competing with the note it belongs to.
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Button
						size="small"
						// `aria-pressed` carries the state for assistive tech;
						// the brand outline is what shows it, since the Design
						// System gives the pressed neutral minimal Button a
						// solid dark fill the design does not use.
						variant={ isActive ? 'outline' : 'minimal' }
						tone={ isActive ? 'brand' : 'neutral' }
						className="editor-collab-sidebar-panel__reaction-button"
						disabled={ disabled }
						aria-pressed={ isActive }
						aria-label={ accessibleLabel }
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
							// Invalidate cached names since the reaction set
							// is changing.
							delete reactionNamesCache[
								`${ noteId }:${ slug }`
							];
							onToggleReaction( slug );
						} }
						onMouseEnter={ fetchReactionNames }
						onFocus={ fetchReactionNames }
					/>
				}
			>
				<span className="editor-collab-sidebar-panel__reaction-button-emoji">
					{ emoji }
				</span>
				<span>{ count }</span>
			</Tooltip.Trigger>
			<Tooltip.Popup>{ accessibleLabel }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

interface ReactionDisplayProps {
	noteId: number;
	reactions: ReactionSummary | null | undefined;
	disabled?: boolean;
	onToggleReaction: ( slug: string ) => void;
	children?: ReactNode;
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param props                  Component props.
 * @param props.noteId           The parent note comment ID.
 * @param props.reactions        The reaction summary (keyed by slug).
 * @param props.disabled         Whether reactions can no longer be toggled
 *                               (the thread is resolved).
 * @param props.onToggleReaction Callback to toggle a reaction.
 * @param props.children         Rendered after the last pill, inside the same
 *                               wrapping row, so a trailing control follows
 *                               the pills onto whichever line they end on.
 */
export default function ReactionDisplay( {
	noteId,
	reactions,
	disabled = false,
	onToggleReaction,
	children,
}: ReactionDisplayProps ) {
	// The list is filterable server-side (and static per page load),
	// so index it once per list identity.
	const emojis = useReactionEmojis();
	const emojiBySlug = useMemo(
		() => buildEmojiBySlugMap( emojis ),
		[ emojis ]
	);
	const reactedSlugs = getReactedSlugs( reactions );

	if ( reactedSlugs.length === 0 && ! children ) {
		return null;
	}

	return (
		// `sm`: at `xs` two adjacent outlined pills read as one shape.
		<Stack
			direction="row"
			gap="sm"
			align="flex-start"
			justify="flex-start"
			wrap="wrap"
		>
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
						emoji={ entry?.emoji ?? slug }
						emojiLabel={ entry?.label ?? slug }
						disabled={ disabled }
						onToggleReaction={ onToggleReaction }
					/>
				);
			} ) }
			{ children }
		</Stack>
	);
}

interface AddReactionButtonProps {
	noteId: number;
	disabled?: boolean;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * Standalone add-reaction button with the curated emoji picker
 * dropdown (the 5-emoji quick row).
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
	return (
		<Dropdown
			className="editor-collab-sidebar-panel__add-reaction"
			popoverProps={ POPOVER_PROPS }
			contentClassName="editor-collab-sidebar-panel__add-reaction-popover"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<IconButton
					size="small"
					// A plain glyph, per the design: no ring or fill at rest.
					variant="minimal"
					tone="neutral"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ reactionIcon }
					label={ __( 'Add reaction' ) }
					aria-expanded={ isOpen }
					disabled={ disabled }
					onClick={ onToggle }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<ReactionEmojiPicker
					onSelect={ ( slug ) => {
						onClose();
						// Invalidate cached tooltip names since adding this
						// reaction changes the set of users for the slug.
						delete reactionNamesCache[ `${ noteId }:${ slug }` ];
						onToggleReaction( slug );
					} }
				/>
			) }
		/>
	);
}
