/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

export default function Edit( { attributes, context } ) {
	const { className } = attributes;
	const { commentId } = context;

	const displayName = useSelect( ( select ) => {
		const { getEntityRecord } = select( 'core' );

		const comment = getEntityRecord( 'root', 'comment', commentId );
		if ( comment && ! comment.authorName ) {
			const user = getEntityRecord( 'root', 'user', comment.author );
			return user?.name ?? __( 'Anonymous' );
		}

		return comment?.authorName ?? '';
	} );

	return <p className={ className }>{ displayName }</p>;
}
