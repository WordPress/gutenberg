/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

export default function PostSlugCheck( { children } ) {
	return (
		<PostTypeSupportCheck supportKeys="slug">
			{ children }
		</PostTypeSupportCheck>
	);
}
