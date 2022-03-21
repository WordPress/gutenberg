/**
 * Internal dependencies
 */
import core__social_link_feed from '../../../test/integration/fixtures/blocks/core__social-link-feed.serialized.html';

export default {
	title: 'Blocks/core__social_link_feed',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_feed } }
		></div>
	);
};
