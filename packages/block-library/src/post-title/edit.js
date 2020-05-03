/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export default function PostTitleEdit( { context } ) {
	const { postType, postId } = context;

	const post = useSelect(
		( select ) =>
			select( 'core' ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);

	if ( ! post ) {
		return null;
	}

	return <h2>{ post.title }</h2>;
}
