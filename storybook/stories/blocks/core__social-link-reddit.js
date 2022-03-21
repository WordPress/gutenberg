/**
 * Internal dependencies
 */
import core__social_link_reddit from '../../../test/integration/fixtures/blocks/core__social-link-reddit.serialized.html';

export default {
	title: 'Blocks/core__social_link_reddit',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_reddit } }
		></div>
	);
};
