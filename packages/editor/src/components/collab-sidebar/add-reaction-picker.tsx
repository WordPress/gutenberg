import type { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';
/*
 * `IconButton` is pending Design System review (WordPress/gutenberg#76135);
 * used here so the trigger matches the reaction pills beside it.
 */
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';
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
import ReactionEmojiPicker, {
	emojiToHexKey,
	emojiToStorageKey,
	buildEmojiBySlugMap,
	useReactionEmojis,
} from './reaction-emoji-picker';
import {
	detectLocale,
	loadEmojibaseData,
	useEmojibaseConfig,
} from './emojibase-data';
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

// Shared by the lazy component and the prefetch, so both hit one request.
function loadEmojiPicker() {
	return import( './emoji-picker' );
}

/**
 * Lazy-load the full picker so its module body runs on first hover or open
 * rather than on every editor load.
 *
 * Whether a *download* is also deferred depends on the bundler: npm
 * consumers who code-split get a chunk, while the plugin build bundles
 * `wpScript` packages as one IIFE that esbuild cannot split.
 */
const FullEmojiPicker = lazy( loadEmojiPicker );

/**
 * Warm the picker before it opens. Both loaders cache, so repeat calls on
 * every hover are free.
 *
 * @param baseUrl Same-origin URL of the Emojibase dataset directory.
 */
function prefetchFullPicker( baseUrl: string | null ): void {
	loadEmojiPicker().catch( () => {} );
	if ( baseUrl ) {
		loadEmojibaseData( baseUrl, detectLocale() ).catch( () => {} );
	}
}

/*
 * `Dropdown`'s popover renders through `Popover.Slot` or a `<body>`-level
 * container, so either way it escapes the sidebar's `overflow: hidden`.
 */
const POPOVER_PROPS = { placement: 'bottom-end' } as const;

/**
 * Loading state for the lazy picker chunk. Announced via the
 * `@wordpress/a11y` announcer, whose live regions already exist: one
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
 * Catches render-time failures from the lazy picker, including a rejected
 * chunk import that `Suspense` does not handle, so the parent can swap in
 * the curated fallback.
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
 * Standalone add-reaction button, opening the full searchable picker with
 * its "Frequently used" section seeded from the curated set.
 *
 * The full picker needs the `noteEmojibaseUrl` editor setting. Without it,
 * or when the module or dataset fails to load, the curated quick row is
 * offered instead so adding a reaction keeps working.
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
	const { baseUrl } = useEmojibaseConfig();
	const hasFullPicker = !! baseUrl;
	const [ pickerFailed, setPickerFailed ] = useState( false );
	/*
	 * A rejected `lazy()` memoizes its failure, so a retry needs a fresh
	 * component; the underlying module request stays cached.
	 */
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
		// Remount the error boundary to clear a caught chunk failure.
		setRetryKey( ( key ) => key + 1 );
		setPickerFailed( false );
	};

	const showFullPicker = hasFullPicker && ! pickerFailed;

	return (
		<Dropdown
			className="editor-collab-sidebar-panel__add-reaction"
			popoverProps={ {
				...POPOVER_PROPS,
				/*
				 * The popover constrains tabbing, so name it as a
				 * non-modal dialog rather than leave screen readers with
				 * an unnamed generic container.
				 */
				role: 'dialog',
				'aria-label': __( 'Add reaction' ),
			} }
			contentClassName={
				showFullPicker
					? 'editor-collab-sidebar-panel__picker-popover'
					: 'editor-collab-sidebar-panel__add-reaction-popover'
			}
			renderToggle={ ( { isOpen, onToggle } ) => (
				<IconButton
					size="small"
					variant="outline"
					tone="neutral"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ smileyIcon }
					label={ __( 'Add reaction' ) }
					aria-haspopup="dialog"
					aria-expanded={ isOpen }
					disabled={ disabled }
					onClick={ onToggle }
					// Warm the picker so the popover opens populated.
					onMouseEnter={
						hasFullPicker
							? () => prefetchFullPicker( baseUrl )
							: undefined
					}
					onFocus={
						hasFullPicker
							? () => prefetchFullPicker( baseUrl )
							: undefined
					}
				/>
			) }
			renderContent={ ( { onClose } ) => {
				const pickReaction = ( slug: string ) => {
					onClose();
					// Adding a reaction changes the slug's reactor list.
					invalidateReactionNames( noteId, slug );
					onToggleReaction( slug );
				};
				const pickCurated = ( slug: string ) => {
					/*
					 * Still count picks, so "Frequently used" is warm if
					 * the site later serves an Emojibase URL.
					 */
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
									/*
									 * Match the filtered list, not the
									 * defaults, so a filter-provided
									 * emoji stores under the same slug.
									 */
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
