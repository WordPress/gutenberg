/**
 * Internal dependencies
 */
import core__social_link_flickr from '../../../test/integration/fixtures/blocks/core__social-link-flickr.serialized.html';

export default {
	title: 'Blocks/core__social_link_flickr',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_flickr } }
		></div>
	);
};
