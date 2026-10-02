import type { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Dropdown } from '@wordpress/components';
/*
 * `IconButton` is pending Design System review (WordPress/gutenberg#76135);
 * used here so the trigger matches the reaction pills beside it.
 */
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';
import { reaction as reactionIcon } from '@wordpress/icons';
import EmojiPicker from './emoji-picker';
import {
	emojiToStorageKey,
	useReactionEmojiRules,
	useReactionEmojis,
} from './reaction-emojis';
import {
	detectLocale,
	loadEmojibaseData,
	useEmojibaseConfig,
} from './emojibase-data';

/*
 * `Dropdown`'s popover renders through `Popover.Slot` or a `<body>`-level
 * container, so either way it escapes the sidebar's `overflow: hidden`.
 */
const POPOVER_PROPS = { placement: 'bottom-end' } as const;

interface RenderToggleArgs {
	isOpen: boolean;
	onToggle: () => void;
	disabled: boolean;
	label: string;
	// Warms the dataset; unset when there is none to load.
	onPrefetch?: () => void;
}

interface AddReactionButtonProps {
	disabled?: boolean;
	label?: string;
	className?: string;
	onToggleReaction: ( slug: string ) => void;
	renderToggle?: ( args: RenderToggleArgs ) => ReactNode;
}

/**
 * Standalone add-reaction button, opening the searchable emoji picker
 * with its "Frequently used" section seeded from the named set.
 *
 * @param props                  Component props.
 * @param props.disabled         Whether the button is disabled (e.g. on a
 *                               resolved note thread).
 * @param props.label            Accessible name of the trigger and of the
 *                               picker dialog. Defaults to "Add reaction".
 * @param props.className        Class of the dropdown wrapper. Defaults to
 *                               the sidebar's hover-revealed trigger class.
 * @param props.onToggleReaction Callback to toggle a reaction.
 * @param props.renderToggle     Renders a custom trigger (e.g. a toolbar
 *                               button) in place of the default icon button.
 */
export function AddReactionButton( {
	disabled = false,
	label = __( 'Add reaction' ),
	className = 'editor-collab-sidebar-panel__add-reaction',
	onToggleReaction,
	renderToggle,
}: AddReactionButtonProps ) {
	const emojis = useReactionEmojis();
	const rules = useReactionEmojiRules();
	const { baseUrl } = useEmojibaseConfig();

	// Warm the dataset before the popover opens; the loader caches, so
	// repeat calls on every hover are free.
	const prefetchDataset = baseUrl
		? () => loadEmojibaseData( baseUrl, detectLocale() ).catch( () => {} )
		: undefined;

	// With an emptied named list and no dataset, or a dataset limited to
	// that list, there is nothing to pick.
	if ( ! emojis.length && ( ! baseUrl || ! rules.allowUnlisted ) ) {
		return null;
	}

	return (
		<Dropdown
			className={ className }
			popoverProps={ {
				...POPOVER_PROPS,
				/*
				 * The popover constrains tabbing, so name it as a
				 * non-modal dialog rather than leave screen readers with
				 * an unnamed generic container.
				 */
				role: 'dialog',
				'aria-label': label,
			} }
			contentClassName="editor-collab-sidebar-panel__picker-popover"
			renderToggle={ ( { isOpen, onToggle } ) =>
				renderToggle ? (
					renderToggle( {
						isOpen,
						onToggle,
						disabled,
						label,
						onPrefetch: prefetchDataset,
					} )
				) : (
					<IconButton
						size="small"
						// A plain glyph, per the design: no ring or fill at rest.
						variant="minimal"
						tone="neutral"
						className="editor-collab-sidebar-panel__add-reaction-button"
						icon={ reactionIcon }
						label={ label }
						aria-haspopup="dialog"
						aria-expanded={ isOpen }
						disabled={ disabled }
						onClick={ onToggle }
						onMouseEnter={ prefetchDataset }
						onFocus={ prefetchDataset }
					/>
				)
			}
			renderContent={ ( { onClose } ) => (
				<EmojiPicker
					onSelect={ ( emoji ) => {
						onClose();
						onToggleReaction( emojiToStorageKey( emoji, emojis ) );
					} }
				/>
			) }
		/>
	);
}
