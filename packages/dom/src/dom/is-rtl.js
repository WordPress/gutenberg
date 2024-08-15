/**
 * Internal dependencies
 */
import getComputedStyle from './get-computed-style';

/**
 * Whether the element's text direction is right-to-left.
 *
 * @param {Element} element The element to check.
 *
 * @return {boolean} True if rtl, false if ltr.
 */
export default function isRTL( element ) {
	return getComputedStyle( element ).direction === 'rtl';
}
