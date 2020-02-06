/**
 * External dependencies
 */
import { css } from '@emotion/core';
import { transform } from 'cssjanus';

function getRtl() {
	return !! ( document && document.documentElement.dir === 'rtl' );
}

/**
 * Simple hook to retrieve RTL direction value
 */
export function useRtl() {
	return getRtl();
}

/**
 * Dynamically transforms
 *
 * @param  {...any} styles
 */
export function rtl( ...styles ) {
	return () => {
		const cssStyles = css( ...styles );
		const isRtl = getRtl();

		return isRtl ? css( transform( cssStyles.styles ) ) : cssStyles;
	};
}
