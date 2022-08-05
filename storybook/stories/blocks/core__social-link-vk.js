/**
 * Internal dependencies
 */
import core__social_link_vk from '../../../test/integration/fixtures/blocks/core__social-link-vk.serialized.html';

export default {
	title: 'Blocks/core__social_link_vk',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__social_link_vk } }></div>
	);
};
