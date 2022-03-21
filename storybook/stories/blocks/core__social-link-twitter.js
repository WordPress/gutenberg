/**
 * Internal dependencies
 */
import core__social_link_twitter from '../../../test/integration/fixtures/blocks/core__social-link-twitter.serialized.html';

export default {
	title: 'Blocks/core__social_link_twitter',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_twitter } }
		></div>
	);
};
