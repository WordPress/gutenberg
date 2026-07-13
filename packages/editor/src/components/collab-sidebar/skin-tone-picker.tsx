/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Composite, Dropdown } from '@wordpress/components';
import { useFocusReturn, useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
 * The six selectable skin tones, in display order. Tone `0` is the
 * default (yellow) presentation — the emoji's base form — and sits
 * leftmost so the default is an explicit, selectable option rather
 * than just the absence of a choice. Tones 1–5 match the Emojibase
 * `tone` values (Fitzpatrick types 1-2 through 6).
 *
 * Every swatch renders the same exemplar emoji (the raised hand) so
 * the only difference between options is the tone itself.
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
 * Resolve the record to display for an emoji at the given skin tone.
 * Returns the matching entry from the emoji's Emojibase `skins` list,
 * or the base entry when the tone is default (0), the emoji has no
 * skin variants, or the only variants are mixed-tone combinations
 * (whose `tone` is an array and can't be produced by a single-tone
 * preference).
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

	// Per the APG listbox pattern, focus lands on the selected option
	// (not the first) when the listbox receives focus. The popover's own
	// focus-on-mount and the composite's `defaultActiveId` race against
	// item registration, so move focus explicitly once on mount;
	// focusing the option also makes it the composite's active item.
	useEffect( () => {
		document.getElementById( selectedOptionId )?.focus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// With the popover's focus-on-mount disabled, its automatic focus
	// return is disabled too — restore focus to the toggle on unmount.
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
				orientation="horizontal"
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
 * Skin tone selector for the emoji picker: a persistent toggle showing
 * the currently selected tone (a raised hand in that tone), opening a
 * flyout of six exemplar swatches under an explicit heading. Selecting
 * a swatch calls `onChange` with the tone number and closes the flyout.
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
	const current =
		SKIN_TONES.find( ( option ) => option.tone === value ) ||
		SKIN_TONES[ 0 ];

	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-end' } }
			// The menu moves focus to the *selected* swatch on mount (per
			// the APG listbox pattern); the popover's own first-element
			// focus would land on the first swatch instead.
			focusOnMount={ false }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="compact"
					className="editor-collab-sidebar-panel__skin-tone-toggle"
					onClick={ onToggle }
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
