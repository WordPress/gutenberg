/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';

function PostAuthorDisplay() {
	const [ authorId ] = useEntityProp( 'postType', 'post', 'author' );
	const author = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecord( 'root', 'user', authorId ),
		[ authorId ]
	);
	return author ? (
		<address>{ sprintf( __( 'By %s' ), author.name ) }</address>
	) : null;
}

export default function PostAuthorEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Author Placeholder';
	}
	return <PostAuthorDisplay />;
}
