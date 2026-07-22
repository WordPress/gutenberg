/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';
import { SVG, Path } from '@wordpress/primitives';
import {
	Component,
	Suspense,
	lazy,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import ReactionEmojiPicker, {
	emojiToHexKey,
	emojiToStorageKey,
	buildEmojiBySlugMap,
	useReactionEmojis,
} from './reaction-emoji-picker';
import { detectLocale, loadEmojibaseData } from './emojibase-data';
import { useFrequentEmojis } from './frequent-emojis';
import { invalidateReactionNames } from './reaction-display';

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
 * Load the full emoji picker module. Shared between the lazy component
 * and the hover/focus prefetch so both resolve through the same module
 * request.
 */
function loadEmojiPicker() {
	return import( './emoji-picker' );
}

/**
 * Lazy-load the full emoji picker. Its bundle is only fetched the first
 * time a user opens (or hovers) the add-reaction trigger in a session;
 * the Emojibase JSON dataset is fetched separately on first open.
 */
const FullEmojiPicker = lazy( loadEmojiPicker );

/**
 * Warm the full picker before it opens: start fetching the lazy picker
 * chunk and the Emojibase dataset for the active locale. Both loaders
 * cache, so calling this repeatedly (every hover) is free after the
 * first invocation.
 */
function prefetchFullPicker(): void {
	loadEmojiPicker().catch( () => {} );
	if ( typeof window !== 'undefined' && window.gutenbergEmojibaseUrl ) {
		loadEmojibaseData( window.gutenbergEmojibaseUrl, detectLocale() ).catch(
			() => {}
		);
	}
}

// `Dropdown`'s popover renders through the active `Popover.Slot` when
// one exists (falling back to a `<body>`-level container), so either
// way it escapes the `overflow: hidden` chain on the collab sidebar
// (`.interface-interface-skeleton__sidebar`,
// `.editor-collab-sidebar`, `.editor-collab-sidebar-panel`).
const POPOVER_PROPS = { placement: 'bottom-end' } as const;

/**
 * Visible loading state shown while the lazy picker chunk resolves.
 * The announcement goes through the `@wordpress/a11y` announcer — its
 * live regions exist before this message — because a live region
 * mounted together with its content is not reliably announced.
 */
function PickerLoading() {
	useEffect( () => {
		speak( __( 'Loading…' ) );
	}, [] );
	return (
		<div className="editor-collab-sidebar-panel__picker">
			<div className="editor-collab-sidebar-panel__picker-status">
				{ __( 'Loading…' ) }
			</div>
		</div>
	);
}

interface PickerErrorBoundaryProps {
	onError: () => void;
	children: ReactNode;
}

/**
 * Catches render-time failures from the lazy picker — most notably a
 * rejected chunk import, which `Suspense` does not handle — and defers
 * to the parent, which swaps in the curated fallback picker.
 */
class PickerErrorBoundary extends Component< PickerErrorBoundaryProps > {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch() {
		this.props.onError();
	}

	render() {
		return this.state.hasError ? null : this.props.children;
	}
}

interface AddReactionButtonProps {
	noteId: number;
	disabled?: boolean;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * Standalone add-reaction button. Opens the full searchable emoji
 * picker directly; its "Frequently used" section is seeded with the
 * curated reaction set, so the previous quick-row picks stay one click
 * away.
 *
 * The full picker only renders when `window.gutenbergEmojibaseUrl` is
 * set — the Gutenberg plugin sets it via PHP, but npm consumers of the
 * editor package must opt in by providing a URL pointing at a
 * self-hosted emojibase dataset. Without it — or when the picker
 * module or its dataset fails to load — the curated quick row is
 * offered instead, so adding a reaction keeps working.
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
	const { recordUse } = useFrequentEmojis();
	const emojis = useReactionEmojis();
	const emojiBySlug = useMemo(
		() => buildEmojiBySlugMap( emojis ),
		[ emojis ]
	);
	const hasFullPicker =
		typeof window !== 'undefined' && !! window.gutenbergEmojibaseUrl;
	const [ pickerFailed, setPickerFailed ] = useState( false );
	// A rejected `lazy()` memoizes its failure, so retrying needs a
	// fresh lazy component. The module request itself is cached by the
	// bundler once it succeeds, so replacements resolve instantly.
	const [ LazyPicker, setLazyPicker ] = useState( () => FullEmojiPicker );
	const [ retryKey, setRetryKey ] = useState( 0 );

	useEffect( () => {
		if ( pickerFailed ) {
			speak(
				__(
					'The full emoji picker couldn’t be loaded. Basic reactions are available.'
				),
				'assertive'
			);
		}
	}, [ pickerFailed ] );

	const retryFullPicker = () => {
		setLazyPicker( () => lazy( loadEmojiPicker ) );
		// Remount the error boundary so a caught chunk failure is
		// cleared along with the failed state.
		setRetryKey( ( key ) => key + 1 );
		setPickerFailed( false );
	};

	const showFullPicker = hasFullPicker && ! pickerFailed;

	return (
		<Dropdown
			popoverProps={ {
				...POPOVER_PROPS,
				// The popup wraps a searchbox, a nested popup trigger, and
				// a grid (full picker) or a listbox (curated fallback), and
				// the popover constrains tabbing within it — expose it as a
				// named non-modal dialog instead of an unnamed generic
				// container so screen readers announce where focus landed.
				role: 'dialog',
				'aria-label': __( 'Add reaction' ),
			} }
			contentClassName={
				showFullPicker
					? 'editor-collab-sidebar-panel__picker-popover'
					: 'editor-collab-sidebar-panel__add-reaction-popover'
			}
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="small"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ smileyIcon }
					label={ __( 'Add reaction' ) }
					aria-haspopup="dialog"
					aria-expanded={ isOpen }
					disabled={ disabled }
					accessibleWhenDisabled
					onClick={ onToggle }
					// Warm up the picker while the user is still
					// deciding: hovering or focusing the trigger starts
					// loading the lazy picker module and the Emojibase
					// dataset, so the popover usually opens fully
					// populated.
					onMouseEnter={
						hasFullPicker ? prefetchFullPicker : undefined
					}
					onFocus={ hasFullPicker ? prefetchFullPicker : undefined }
				/>
			) }
			renderContent={ ( { onClose } ) => {
				const pickReaction = ( slug: string ) => {
					onClose();
					// Invalidate cached tooltip names since adding this
					// reaction changes the set of users for the slug.
					invalidateReactionNames( noteId, slug );
					onToggleReaction( slug );
				};
				const pickCurated = ( slug: string ) => {
					// Keep counting picks toward the full picker's
					// "Frequently used" section so the history is
					// warm if the site later provides an Emojibase
					// URL.
					recordUse(
						emojiToHexKey( emojiBySlug.get( slug )?.emoji ?? '' )
					);
					pickReaction( slug );
				};

				if ( ! hasFullPicker ) {
					return <ReactionEmojiPicker onSelect={ pickCurated } />;
				}

				if ( pickerFailed ) {
					return (
						<div className="editor-collab-sidebar-panel__picker-fallback">
							<ReactionEmojiPicker onSelect={ pickCurated } />
							<div className="editor-collab-sidebar-panel__picker-fallback-note">
								{ __( 'Couldn’t load the full emoji picker.' ) }
								<Button
									variant="link"
									onClick={ retryFullPicker }
								>
									{ __( 'Retry' ) }
								</Button>
							</div>
						</div>
					);
				}

				return (
					<PickerErrorBoundary
						key={ retryKey }
						onError={ () => setPickerFailed( true ) }
					>
						<Suspense fallback={ <PickerLoading /> }>
							<LazyPicker
								onSelect={ ( emoji ) =>
									// Match against the filtered curated
									// list, not just the defaults, so a
									// filter-provided emoji picked here
									// stores under the same slug as a
									// quick-row pick.
									pickReaction(
										emojiToStorageKey( emoji, emojis )
									)
								}
								onError={ () => setPickerFailed( true ) }
							/>
						</Suspense>
					</PickerErrorBoundary>
				);
			} }
		/>
	);
}
