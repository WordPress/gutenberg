/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import useDebounce from '../use-debounce';

const WAIT = 500;

/**
 * Returns a debounced speak function.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-a11y/#speak
 */
export default function useDebouncedSpeak() {
	return useDebounce( speak, WAIT );
}
