/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { Slot } from './slot-fill';

export default function FootnotesEdit() {
	return (
		<footer { ...useBlockProps() }>
			<ol>
				<Slot />
			</ol>
		</footer>
	);
}
