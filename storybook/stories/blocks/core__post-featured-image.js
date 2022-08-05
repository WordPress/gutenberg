/**
 * Internal dependencies
 */
import core__post_featured_image from '../../../test/integration/fixtures/blocks/core__post-featured-image.serialized.html';

export default {
	title: 'Blocks/core__post_featured_image',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__post_featured_image } }
		></div>
	);
};
