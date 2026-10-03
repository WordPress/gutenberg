import type { MouseEvent, ReactNode } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
/*
 * `Button` is pending Design System review (WordPress/gutenberg#76135);
 * used here for its pill shape and quiet neutral treatment.
 */
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Stack, Tooltip } from '@wordpress/ui';
import { useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { getCuratedLabel, hexKeyToEmoji } from './reaction-emojis';
import { useEmojiLabel } from './emojibase-data';
import {
	getReactionTargetKey,
	getReactionsQueryArgs,
	type ReactionSummary,
	type ReactionTarget,
} from './block-reactions';

/**
 * A comment record as returned by the reactions REST query.
 */
interface ReactionComment {
	author_name: string;
	content: string | { raw?: string; rendered?: string };
}

/**
 * Get the count of reactions for a specific emoji.
 *
 * @param reactions The reactions summary (keyed by hex key).
 * @param hexKey    The reaction hex key to count.
 * @return The count of reactions.
 */
function getReactionCount(
	reactions: ReactionSummary | null | undefined,
	hexKey: string
): number {
	return reactions?.[ hexKey ]?.count || 0;
}

/**
 * Check if the current user has reacted with a specific emoji.
 *
 * @param reactions The reactions summary (keyed by hex key).
 * @param hexKey    The reaction hex key to check.
 * @return Whether the user has reacted.
 */
function hasUserReacted(
	reactions: ReactionSummary | null | undefined,
	hexKey: string
): boolean {
	return reactions?.[ hexKey ]?.reacted || false;
}

/**
 * Get all reaction hex keys that have reactions.
 *
 * @param reactions The reactions summary (keyed by hex key).
 * @return Array of hex keys with reactions.
 */
export function getReactedHexKeys(
	reactions: ReactionSummary | null | undefined
): string[] {
	if ( ! reactions ) {
		return [];
	}
	return Object.keys( reactions ).filter(
		( hexKey ) => reactions[ hexKey ]?.count > 0
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
			__( '%1$s reacted with %2$s' ),
			names[ 0 ],
			emojiLabel
		);
	}

	if ( names.length === 2 ) {
		return sprintf(
			/* translators: 1: first user name, 2: second user name, 3: emoji label. */
			__( '%1$s and %2$s reacted with %3$s' ),
			names[ 0 ],
			names[ 1 ],
			emojiLabel
		);
	}

	const othersCount = names.length - 2;
	return sprintf(
		/* translators: 1: first user name, 2: second user name, 3: number of other users, 4: emoji label. */
		_n(
			'%1$s, %2$s, and %3$d other reacted with %4$s',
			'%1$s, %2$s, and %3$d others reacted with %4$s',
			othersCount
		),
		names[ 0 ],
		names[ 1 ],
		othersCount,
		emojiLabel
	);
}

const REACTIONS_PER_PAGE = 100;

// A target with more reactions than this is not worth walking page by page
// just to name them; the pill falls back to its count-based label instead.
const MAX_REACTION_PAGES = 10;

/**
 * Fetches every reaction on a target, across every emoji.
 *
 * The REST collection cannot be filtered by reaction hex key, so the whole set
 * has to come back before it can be grouped. Walks the pages rather than
 * reading only the first one, which would drop reactors on a busy target.
 *
 * @param target The note or block the reactions hang off.
 * @return All reactions on the target, or `null` if there are more than the
 *         walk is willing to fetch.
 */
async function fetchReactions(
	target: ReactionTarget
): Promise< ReactionComment[] | null > {
	const reactions: ReactionComment[] = [];

	for ( let page = 1; page <= MAX_REACTION_PAGES; page++ ) {
		let batch: ReactionComment[];
		try {
			batch = await apiFetch< ReactionComment[] >( {
				path: addQueryArgs( '/wp/v2/comments', {
					...getReactionsQueryArgs( target ),
					page,
					per_page: REACTIONS_PER_PAGE,
					_fields: 'author_name,content',
				} ),
			} );
		} catch ( error ) {
			// A full last page (exactly 100, 200, ... reactions) sends the
			// walk one page past the end, which the endpoint rejects.
			if (
				page > 1 &&
				( error as { code?: string } )?.code ===
					'rest_comment_invalid_page_number'
			) {
				return reactions;
			}
			throw error;
		}

		reactions.push( ...batch );

		if ( batch.length < REACTIONS_PER_PAGE ) {
			return reactions;
		}
	}

	return null;
}

// Module-level cache for reaction details: { "targetKey:hexKey": string[] }
const reactionNamesCache: Record< string, string[] > = {};

/**
 * Drop the cached reactor names for a target/hex key pair, so the next tooltip
 * refetches them.
 *
 * @param target The note or block the reaction hangs off.
 * @param hexKey The reaction hex key.
 */
export function invalidateReactionNames(
	target: ReactionTarget,
	hexKey: string
): void {
	delete reactionNamesCache[
		`${ getReactionTargetKey( target ) }:${ hexKey }`
	];
}

interface ReactionButtonProps {
	target: ReactionTarget;
	hexKey: string;
	count: number;
	isActive: boolean;
	emoji: string;
	emojiLabel?: string;
	disabled?: boolean;
	onToggleReaction: ( hexKey: string ) => void;
	onRemoveLast?: () => void;
}

/**
 * A single reaction pill button that lazy-loads user names on hover.
 *
 * @param props                  Component props.
 * @param props.target           The note or block the reaction hangs off.
 * @param props.hexKey           The emoji hex key.
 * @param props.count            The reaction count.
 * @param props.isActive         Whether the current user reacted.
 * @param props.emoji            The emoji character.
 * @param props.emojiLabel       The emoji label, if known (curated reactions
 *                               only).
 * @param props.disabled         Whether the reaction can no longer be toggled
 *                               (the thread is resolved).
 * @param props.onToggleReaction Callback to toggle a reaction.
 * @param props.onRemoveLast     Where to send focus when removing the last
 *                               reaction unmounts this pill. Defaults to the
 *                               enclosing sidebar thread.
 */
function ReactionButton( {
	target,
	hexKey,
	count,
	isActive,
	emoji,
	emojiLabel,
	disabled = false,
	onToggleReaction,
	onRemoveLast,
}: ReactionButtonProps ) {
	const [ names, setNames ] = useState< string[] | null >( null );
	const [ isFetching, setIsFetching ] = useState( false );
	// Hover or keyboard focus, which gates the Emojibase fetch below.
	const [ isReached, setIsReached ] = useState( false );
	/*
	 * An emoji outside the curated set has no label of its own, so resolve
	 * one from Emojibase; until it arrives the emoji character stands in.
	 */
	const resolvedLabel = useEmojiLabel( hexKey, ! emojiLabel, isReached );
	const label = emojiLabel || resolvedLabel || emoji;
	/*
	 * Derived, not stored: the names and label requests race, and a stored
	 * string would freeze whichever resolved first.
	 */
	const tooltipText =
		names && names.length > 0 ? formatReactionTooltip( names, label ) : '';

	const fetchReactionNames = useCallback( () => {
		setIsReached( true );
		const cacheKey = `${ getReactionTargetKey( target ) }:${ hexKey }`;
		if ( reactionNamesCache[ cacheKey ] ) {
			setNames( reactionNamesCache[ cacheKey ] );
			return;
		}

		if ( isFetching ) {
			return;
		}

		/*
		 * A miss on a pill that already listed names means it was
		 * invalidated; drop the stale list rather than show it against
		 * the new count while refetching.
		 */
		setNames( null );
		setIsFetching( true );
		fetchReactions( target )
			.then( ( reactions ) => {
				// A truncated walk would drop reactors, and a partial name
				// list reads as complete. Keep the count-based label instead.
				if ( ! reactions ) {
					return;
				}

				const fetchedNames = reactions
					.filter( ( r ) => {
						const content =
							typeof r.content === 'object'
								? r.content?.raw || r.content?.rendered
								: r.content;
						const clean = content
							?.replace?.( /<[^>]*>/g, '' )
							?.trim();
						return clean === hexKey;
					} )
					.map( ( r ) => r.author_name );

				reactionNamesCache[ cacheKey ] = fetchedNames;
				setNames( fetchedNames );
			} )
			.catch( () => {
				// Silently fall back to count-based label.
			} )
			.finally( () => {
				setIsFetching( false );
			} );
	}, [ target, hexKey, isFetching ] );

	const defaultLabel = sprintf(
		/* translators: 1: emoji label, 2: count of reactions */
		_n( '%1$s, %2$d reaction', '%1$s, %2$d reactions', count ),
		label,
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
							// the button will disappear. Move focus somewhere
							// that survives it to prevent focus loss.
							if ( isActive && count === 1 ) {
								if ( onRemoveLast ) {
									onRemoveLast();
								} else {
									( event.target as HTMLElement )
										.closest< HTMLElement >(
											'.editor-collab-sidebar-panel__thread'
										)
										?.focus();
								}
							}
							setNames( null );
							onToggleReaction( hexKey );
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
	target: ReactionTarget;
	reactions: ReactionSummary | null | undefined;
	disabled?: boolean;
	onToggleReaction: ( hexKey: string ) => void;
	onRemoveLast?: () => void;
	children?: ReactNode;
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param props                  Component props.
 * @param props.target           The note or block the reactions hang off.
 * @param props.reactions        The reaction summary (keyed by hex key).
 * @param props.disabled         Whether reactions can no longer be toggled
 *                               (the thread is resolved).
 * @param props.onToggleReaction Callback to toggle a reaction.
 * @param props.onRemoveLast     Where to send focus when the last reaction
 *                               of a pill is removed.
 * @param props.children         Rendered after the last pill, inside the same
 *                               wrapping row, so a trailing control follows
 *                               the pills onto whichever line they end on.
 */
export default function ReactionDisplay( {
	target,
	reactions,
	disabled = false,
	onToggleReaction,
	onRemoveLast,
	children,
}: ReactionDisplayProps ) {
	const reactedHexKeys = getReactedHexKeys( reactions );

	if ( reactedHexKeys.length === 0 && ! children ) {
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
			{ reactedHexKeys.map( ( hexKey ) => {
				const count = getReactionCount( reactions, hexKey );
				const isActive = hasUserReacted( reactions, hexKey );

				return (
					<ReactionButton
						key={ hexKey }
						target={ target }
						hexKey={ hexKey }
						count={ count }
						isActive={ isActive }
						emoji={ hexKeyToEmoji( hexKey ) }
						emojiLabel={ getCuratedLabel( hexKey ) }
						disabled={ disabled }
						onToggleReaction={ onToggleReaction }
						onRemoveLast={ onRemoveLast }
					/>
				);
			} ) }
			{ children }
		</Stack>
	);
}
