/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

export default function Edit( { attributes, context } ) {
	const { className } = attributes;
	const { commentId } = context;

	const displayName = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );

		const comment = getEntityRecord( 'root', 'comment', commentId );
		const authorName = comment?.author_name; // eslint-disable-line camelcase

		if ( comment && ! authorName ) {
			const user = getEntityRecord( 'root', 'user', comment.author );
			return user?.name ?? __( 'Anonymous' );
		}

		return authorName ?? '';
	} );

	return (
		<div { ...useBlockProps() }>
			<p className={ className }>{ displayName }</p>
		</div>
	);
}
