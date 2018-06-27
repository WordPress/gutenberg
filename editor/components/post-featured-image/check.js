/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import ThemeSupportCheck from '../theme-support-check';

function PostFeaturedImageCheck( props ) {
	const { postType } = props;
	return (
		<ThemeSupportCheck supportKeys="post-thumbnails" postType={ postType } >
			<PostTypeSupportCheck { ...props } supportKeys="thumbnail" />
		</ThemeSupportCheck>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	return {
		postType: getEditedPostAttribute( 'type' ),
	};
} );
export default compose(
	applyWithSelect,
)( PostFeaturedImageCheck );
