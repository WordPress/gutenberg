/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { InspectorControls } from '@wordpress/block-editor';

const CreateNewPostLink = ( {
	attributes: { query: { postType } = {} } = {},
} ) => {
	if ( ! postType ) return null;
	const newPostUrl = addQueryArgs( 'post-new.php', {
		post_type: postType,
	} );
	return (
		<div className="wp-block-query__create-new-link">
			{ createInterpolateElement(
				__( '<a>Create a new post</a> for this feed.' ),
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				{ a: <a href={ newPostUrl } /> }
			) }
		</div>
	);
};

/**
 * Override the default edit UI to include layout controls
 *
 * @param {Object} props
 */
const queryTopInspectorControls = ( props ) => {
	const { name, isSelected } = props;
	if ( name !== 'core/query' || ! isSelected ) {
		return null;
	}

	return (
		<InspectorControls>
			<CreateNewPostLink { ...props } />
		</InspectorControls>
	);
};

export default queryTopInspectorControls;
