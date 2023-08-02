/**
 * External dependencies
 */
import { FastAverageColor } from 'fast-average-color';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

/**
 * useCoverIsDark is a hook that specifyies if the cover
 * background is dark or not.
 *
 * @param {Function} setAttributes function to set attributes.
 * @return {Function} Function to calculate isDark attribute.
 */
export default function useCoverIsDark( setAttributes ) {
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const getCoverIsDark = useCallback(
		( url, dimRatio = 50, overlayColor ) => {
			if ( url && dimRatio <= 50 ) {
				const imgCrossOrigin = applyFilters(
					'media.crossOrigin',
					undefined,
					url
				);
				return retrieveFastAverageColor()
					.getColorAsync( url, {
						// Previously the default color was white, but that changed
						// in v6.0.0 so it has to be manually set now.
						defaultColor: [ 255, 255, 255, 255 ],
						// Errors that come up don't reject the promise, so error
						// logging has to be silenced with this option.
						silent: process.env.NODE_ENV === 'production',
						crossOrigin: imgCrossOrigin,
					} )
					.then( ( color ) => {
						__unstableMarkNextChangeAsNotPersistent();
						setAttributes( { isDark: color.isDark } );
					} );
			}

			if ( dimRatio > 50 || ! url ) {
				if ( ! overlayColor ) {
					// If no overlay color exists the overlay color is black (isDark )
					__unstableMarkNextChangeAsNotPersistent();
					setAttributes( { isDark: true } );
					return;
				}
				__unstableMarkNextChangeAsNotPersistent();
				setAttributes( { isDark: colord( overlayColor ).isDark() } );
				return;
			}

			if ( ! url && ! overlayColor ) {
				// Reset isDark.
				__unstableMarkNextChangeAsNotPersistent();
				setAttributes( { isDark: false } );
				return;
			}
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { isDark: false } );
		},
		[ setAttributes, __unstableMarkNextChangeAsNotPersistent ]
	);
	return getCoverIsDark;
}
