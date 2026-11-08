import clsx from 'clsx';
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import { Icon as WCIcon } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { User } from '@wordpress/core-data';
import type { BasePostWithEmbeddedAuthor } from '../../dataviews/types';

function AuthorView( { item }: { item: BasePostWithEmbeddedAuthor } ) {
	// Revisions don't embed their author, so fetch the user record unless the
	// item carries an `_embedded` author matching its `author`.
	const authorId = item?.author;
	const embeddedAuthorId = item?._embedded?.author?.[ 0 ]?.id;
	const shouldFetch = Boolean(
		authorId && ( ! embeddedAuthorId || authorId !== embeddedAuthorId )
	);
	const author = useSelect(
		( select ) => {
			if ( ! shouldFetch ) {
				return null;
			}
			const { getEntityRecords } = select( coreStore );
			// Query the collection with `who: 'authors'` instead of calling
			// `getEntityRecord`, because the single user endpoint denies
			// access to authors without published posts for users who can't
			// list users. See https://core.trac.wordpress.org/ticket/56429.
			return (
				getEntityRecords< User >( 'root', 'user', {
					include: [ authorId ],
					who: 'authors',
					context: 'view',
				} )?.[ 0 ] ?? null
			);
		},
		[ authorId, shouldFetch ]
	);
	// Use fetched author if available, otherwise use _embedded.
	const text = author?.name || item?._embedded?.author?.[ 0 ]?.name;
	const imageUrl =
		author?.avatar_urls?.[ 48 ] ||
		item?._embedded?.author?.[ 0 ]?.avatar_urls?.[ 48 ];
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	return (
		<Stack direction="row" align="center">
			{ !! imageUrl && (
				<div
					className={ clsx(
						'editor-post-revisions-timeline__author-avatar',
						{
							'is-loaded': isImageLoaded,
						}
					) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt={ __( 'Author avatar' ) }
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="editor-post-revisions-timeline__author-icon">
					<WCIcon icon={ authorIcon } />
				</div>
			) }
			<span className="editor-post-revisions-timeline__author-name">
				{ text }
			</span>
		</Stack>
	);
}

/**
 * The author of a revision. The timeline only renders it, so it leaves out
 * the editing and filtering parts of the author field of the post types.
 */
const authorField: Field< BasePostWithEmbeddedAuthor > = {
	label: __( 'Author' ),
	id: 'author',
	type: 'integer',
	render: AuthorView,
};

export default authorField;
