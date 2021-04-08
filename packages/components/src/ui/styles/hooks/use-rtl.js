/**
 * @return {boolean} Whether the current document is RTL.
 */
export function useRTL() {
	return document?.documentElement?.dir === 'rtl';
}
