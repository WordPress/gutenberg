/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Preference control for what happens when an animated GIF is uploaded:
 * ask each time (default), always convert to a video, or always keep the
 * GIF. The GifConversionPrompt reads the same preference, and its
 * "Remember my choice" checkbox writes it.
 */
export default function AnimatedGifUploadsOption() {
	const value = useSelect(
		( select ) =>
			select( preferencesStore ).get(
				'core/media',
				'animatedGifUploads'
			) ?? 'ask',
		[]
	);
	const { set: setPreference } = useDispatch( preferencesStore );

	return (
		<SelectControl
			label={ __( 'Animated GIF uploads' ) }
			help={ __(
				'Animated GIFs can be converted to videos on upload. Videos are much smaller and use less power, and look the same.'
			) }
			value={ value }
			options={ [
				{ value: 'ask', label: __( 'Ask each time' ) },
				{ value: 'video', label: __( 'Convert to video' ) },
				{ value: 'gif', label: __( 'Keep as GIF' ) },
			] }
			onChange={ ( next ) =>
				setPreference( 'core/media', 'animatedGifUploads', next )
			}
		/>
	);
}
