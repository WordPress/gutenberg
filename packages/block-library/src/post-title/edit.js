/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export default function PostTitleEdit( { context } ) {
	const { postType, postId } = context;

	// The unused `getEntityRecord` is necessary to trigger the default resolver
	// behavior to fetch the post if not already known. Ideally this is built-in
	// to `getEditedEntityRecord`, which derives using `getEntityRecord`.
	const [ post ] = useSelect(
		( select ) => [
			select( 'core' ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
			select( 'core' ).getEntityRecord( 'postType', postType, postId ),
		],
		[ 'postType', 'postId' ]
	);

	if ( ! post ) {
		return null;
	}

	return <h2>{ post.title }</h2>;
}
