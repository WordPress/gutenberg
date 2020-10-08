/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

/**
 * Returns a speak function.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-a11y/#speak
 */
export default function useSpeak() {
	return speak;
}
