import { __, sprintf } from '@wordpress/i18n';
import { Button, Composite, Dropdown } from '@wordpress/components';
import { useFocusReturn, useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import type { EmojibaseEntry, EmojibaseSkin } from './emojibase-data';

/**
 * A selectable skin tone swatch.
 */
interface SkinToneOption {
	tone: number;
	emoji: string;
	label: string;
}

interface SkinTonePickerProps {
	value: number;
	onChange: ( tone: number ) => void;
}

interface SkinToneMenuProps extends SkinTonePickerProps {
	baseId: string;
	onClose: () => void;
}

/**
 * The six skin tones in display order. Tone `0` is the default yellow
 * presentation, listed first so it is an explicit choice rather than the
 * absence of one; 1-5 match the Emojibase `tone` values. Every swatch uses
 * the same exemplar emoji so only the tone differs.
 */
export const SKIN_TONES: SkinToneOption[] = [
	{ tone: 0, emoji: '✋', label: __( 'Default skin tone' ) },
	{ tone: 1, emoji: '✋🏻', label: __( 'Light skin tone' ) },
	{ tone: 2, emoji: '✋🏼', label: __( 'Medium-light skin tone' ) },
	{ tone: 3, emoji: '✋🏽', label: __( 'Medium skin tone' ) },
	{ tone: 4, emoji: '✋🏾', label: __( 'Medium-dark skin tone' ) },
	{ tone: 5, emoji: '✋🏿', label: __( 'Dark skin tone' ) },
];

/**
 * The record to display for an emoji at a given skin tone. Falls back to
 * the base entry for tone 0, for emoji without variants, and for
 * mixed-tone variants, which a single-tone preference cannot produce.
 *
 * @param entry Emojibase emoji record.
 * @param tone  Selected tone, 0 (default) through 5.
 * @return The record to render: a skin variant or the base entry.
 */
export function applySkinTone(
	entry: EmojibaseEntry,
	tone: number
): EmojibaseEntry | EmojibaseSkin {
	if ( ! tone || ! Array.isArray( entry.skins ) ) {
		return entry;
	}
	return entry.skins.find( ( skin ) => skin.tone === tone ) || entry;
}

/**
 * The flyout body: a heading and the six-swatch listbox.
 *
 * @param props          Component props.
 * @param props.value    The selected tone, 0–5.
 * @param props.onChange Called with the newly selected tone.
 * @param props.baseId   Unique ID prefix for the heading and options.
 * @param props.onClose  Closes the flyout.
 */
function SkinToneMenu( {
	value,
	onChange,
	baseId,
	onClose,
}: SkinToneMenuProps ) {
	const headingId = `${ baseId }-heading`;
	const optionId = ( tone: number ) => `${ baseId }-option-${ tone }`;
	const current =
		SKIN_TONES.find( ( option ) => option.tone === value ) ||
		SKIN_TONES[ 0 ];
	const selectedOptionId = optionId( current.tone );

	/*
	 * Per the APG listbox pattern focus lands on the selected option. The
	 * popover's focus-on-mount and the composite's `defaultActiveId` race
	 * against item registration, so move focus explicitly on mount.
	 */
	useEffect( () => {
		document.getElementById( selectedOptionId )?.focus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Disabling the popover's focus-on-mount also disables its focus return.
	const focusReturnRef = useFocusReturn();

	return (
		<div
			ref={ focusReturnRef }
			className="editor-collab-sidebar-panel__skin-tone-menu"
		>
			<div
				id={ headingId }
				className="editor-collab-sidebar-panel__skin-tone-heading"
			>
				{ __( 'Choose your default skin tone' ) }
			</div>
			<Composite
				role="listbox"
				/*
				 * `orientation` only configures arrow-key handling and is
				 * not rendered, so set the ARIA attribute explicitly.
				 */
				orientation="horizontal"
				aria-orientation="horizontal"
				aria-labelledby={ headingId }
				defaultActiveId={ selectedOptionId }
				className="editor-collab-sidebar-panel__skin-tone-options"
			>
				{ SKIN_TONES.map( ( { tone, emoji, label } ) => (
					<Composite.Item
						key={ tone }
						id={ optionId( tone ) }
						render={
							<Button
								role="option"
								size="compact"
								aria-selected={ tone === value }
								aria-label={ label }
								className="editor-collab-sidebar-panel__skin-tone-option"
								onClick={ () => {
									onChange( tone );
									onClose();
								} }
							/>
						}
					>
						{ emoji }
					</Composite.Item>
				) ) }
			</Composite>
		</div>
	);
}

/**
 * Skin tone selector: a toggle showing the selected tone, opening a flyout
 * of six swatches under a heading.
 *
 * @param props          Component props.
 * @param props.value    The selected tone, 0–5.
 * @param props.onChange Called with the newly selected tone.
 */
export default function SkinTonePicker( {
	value,
	onChange,
}: SkinTonePickerProps ) {
	const baseId = useInstanceId(
		SkinTonePicker,
		'editor-collab-sidebar-panel__skin-tone'
	);
	// Mirrors `SkinToneMenu`'s heading id, to name the popup container.
	const headingId = `${ baseId }-heading`;
	const current =
		SKIN_TONES.find( ( option ) => option.tone === value ) ||
		SKIN_TONES[ 0 ];

	return (
		<Dropdown
			popoverProps={ {
				placement: 'bottom-end',
				/*
				 * A heading can't live inside a listbox, so the wrapper is
				 * exposed as a named non-modal dialog.
				 */
				role: 'dialog',
				'aria-labelledby': headingId,
			} }
			// The menu focuses the selected swatch; this would focus the first.
			focusOnMount={ false }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="compact"
					className="editor-collab-sidebar-panel__skin-tone-toggle"
					onClick={ onToggle }
					aria-haspopup="dialog"
					aria-expanded={ isOpen }
					label={ sprintf(
						// translators: %s: the selected skin tone, e.g. "Medium skin tone".
						__( 'Skin tone: %s' ),
						current.label
					) }
					showTooltip
				>
					{ current.emoji }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<SkinToneMenu
					value={ value }
					onChange={ onChange }
					baseId={ baseId }
					onClose={ onClose }
				/>
			) }
		/>
	);
}
