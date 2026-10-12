import getComputedStyle from './get-computed-style';

/**
 * Whether the element's text direction is right-to-left.
 *
 * @param element The element to check.
 *
 * @return True if rtl, false if ltr.
 */
export default function isRTL( element: Element ): boolean {
	return getComputedStyle( element ).direction === 'rtl';
}
