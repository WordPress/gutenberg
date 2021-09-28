/**
 * WordPress dependencies
 */
import { getPathAndQueryString } from '@wordpress/url';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { edit } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

export default function NavigateToLink( {
	type,
	id,
	activePage,
	onActivePageChange,
} ) {
	const post = useSelect(
		( select ) =>
			type &&
			id &&
			type !== 'URL' &&
			select( coreStore ).getEntityRecord( 'postType', type, id ),
		[ type, id ]
	);

	const onClick = useMemo( () => {
		if ( ! post?.link ) return null;
		const path = getPathAndQueryString( post.link );
		if ( path === activePage?.path ) return null;
		return () =>
			onActivePageChange( {
				type,
				slug: post.slug,
				path,
				context: {
					postType: post.type,
					postId: post.id,
				},
			} );
	}, [ post, activePage?.path, onActivePageChange ] );

	return (
		onClick && (
			<Button
				icon={ edit }
				label={ __( 'Edit Page Template' ) }
				onClick={ onClick }
			/>
		)
	);
}
