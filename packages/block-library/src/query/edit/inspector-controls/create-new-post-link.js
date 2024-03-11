/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';

const CreateNewPostLink = ( {
	attributes: { query: { postType } = {} } = {},
} ) => {
	if ( ! postType ) {
		return null;
	}
	const newPostUrl = addQueryArgs( 'post-new.php', {
		post_type: postType,
	} );

	const addNewItemLabel =
		select( coreStore ).getPostType( postType )?.labels?.add_new_item;

	return (
		<div className="wp-block-query__create-new-link">
			{ createInterpolateElement(
				'<a>' + addNewItemLabel + '</a>',
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				{ a: <a href={ newPostUrl } /> }
			) }
		</div>
	);
};

export default CreateNewPostLink;
