/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

const CreateNewPostLink = ( { postType } ) => {
	const newPostUrl = addQueryArgs( 'post-new.php', {
		post_type: postType,
	} );

	const addNewItemLabel = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			return getPostType( postType )?.labels?.add_new_item;
		},
		[ postType ]
	);
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
