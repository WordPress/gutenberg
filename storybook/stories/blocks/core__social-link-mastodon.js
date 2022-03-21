/**
 * Internal dependencies
 */
import core__social_link_mastodon from '../../../test/integration/fixtures/blocks/core__social-link-mastodon.serialized.html';

export default {
	title: 'Blocks/core__social_link_mastodon',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_mastodon } }
		></div>
	);
};
