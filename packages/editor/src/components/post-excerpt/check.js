/**
 * Internal dependencies
 */
import { usePostTypeSupportCheck } from '../post-type-support-check';

export default function PostExcerptCheck( children ) {
	return usePostExcerptCheck() ? children : null;
}

export function usePostExcerptCheck() {
	return usePostTypeSupportCheck( 'excerpt' );
}
