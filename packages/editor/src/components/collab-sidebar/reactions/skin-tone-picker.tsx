import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
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
 * Skin tone selector: a toggle showing the selected tone, opening a menu
 * of the six tones as a radio group.
 *
 * @param props          Component props.
 * @param props.value    The selected tone, 0–5.
 * @param props.onChange Called with the newly selected tone.
 */
export default function SkinTonePicker( {
	value,
	onChange,
}: SkinTonePickerProps ) {
	const current =
		SKIN_TONES.find( ( option ) => option.tone === value ) ||
		SKIN_TONES[ 0 ];

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						__next40pxDefaultSize
						className="editor-collab-sidebar-panel__skin-tone-toggle"
						label={ sprintf(
							// translators: %s: the selected skin tone, e.g. "Medium skin tone".
							__( 'Skin tone: %s' ),
							current.label
						) }
						showTooltip
					/>
				}
			>
				{ current.emoji }
			</Menu.Trigger>
			<Menu.Popup
				positioner={ <Menu.Positioner side="bottom" align="end" /> }
			>
				<Menu.RadioGroup
					value={ current.tone }
					onValueChange={ ( tone: number ) => onChange( tone ) }
				>
					<Menu.GroupLabel>
						{ __( 'Choose your default skin tone' ) }
					</Menu.GroupLabel>
					{ SKIN_TONES.map( ( { tone, emoji, label } ) => (
						<Menu.RadioItem
							key={ tone }
							value={ tone }
							// Picking a tone is the whole task, so close on it.
							closeOnClick
							prefix={
								<span
									className="editor-collab-sidebar-panel__skin-tone-swatch"
									aria-hidden="true"
								>
									{ emoji }
								</span>
							}
						>
							<Menu.ItemLabel>{ label }</Menu.ItemLabel>
						</Menu.RadioItem>
					) ) }
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.Root>
	);
}
