/**
 * External dependencies
 */
import { FastAverageColor } from 'fast-average-color';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

/**
 * Derives the `isDark` attribute.
 *
 * @param {?string}  url           Url of the media background.
 * @param {?number}  dimRatio      Transparency of the overlay color. If an image and
 *                                 color are set, dimRatio is used to decide what is used
 *                                 for background darkness checking purposes.
 * @param {?string}  overlayColor  String containing the overlay color value if one exists.
 * @param {Function} setAttributes Block attributes setter.
 */
function useCoverIsDark( url, dimRatio = 50, overlayColor, setAttributes ) {
	const [ mediaIsDark, setMediaIsDark ] = useState();
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	let isDark;

	// When opacity is less than 50 uses the media’s determined dark state.
	if ( url && dimRatio <= 50 ) {
		isDark = !! mediaIsDark;
	}
	// When opacity is greater than 50 uses the overlay color’s darkness.
	else if ( dimRatio > 50 ) {
		// If no overlay color exists the overlay color is black (isDark)
		isDark = ! overlayColor || colord( overlayColor ).isDark();
	}
	// Without an overlay color and opacity less than 50 the overlay color
	// is black yet not opaque enough to be dark.
	else if ( ! url && ! overlayColor ) {
		isDark = false;
	}

	useEffect( () => {
		if ( url ) {
			const imgCrossOrigin = applyFilters(
				'media.crossOrigin',
				undefined,
				url
			);
			retrieveFastAverageColor()
				.getColorAsync( url, {
					// Previously the default color was white, but that changed
					// in v6.0.0 so it has to be manually set now.
					defaultColor: [ 255, 255, 255, 255 ],
					// Errors that come up don't reject the promise, so error
					// logging has to be silenced with this option.
					silent: process.env.NODE_ENV === 'production',
					crossOrigin: imgCrossOrigin,
				} )
				.then( ( color ) => setMediaIsDark( color.isDark ) );
		}
	}, [ url ] );

	// Updates `isDark` in attributes without an editor history entry.
	useEffect( () => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { isDark } );
	}, [ isDark, setAttributes, __unstableMarkNextChangeAsNotPersistent ] );
}

export default useCoverIsDark;
