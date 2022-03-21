/**
 * Internal dependencies
 */
import core__social_link_pocket from '../../../test/integration/fixtures/blocks/core__social-link-pocket.serialized.html';

export default {
	title: 'Blocks/core__social_link_pocket',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_pocket } }
		></div>
	);
};
