/**
 * Internal dependencies
 */
import core__social_link_tumblr from '../../../test/integration/fixtures/blocks/core__social-link-tumblr.serialized.html';

export default {
	title: 'Blocks/core__social_link_tumblr',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_tumblr } }
		></div>
	);
};
