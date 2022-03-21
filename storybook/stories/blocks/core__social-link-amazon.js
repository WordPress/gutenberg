/**
 * Internal dependencies
 */
import core__social_link_amazon from '../../../test/integration/fixtures/blocks/core__social-link-amazon.serialized.html';

export default {
	title: 'Blocks/core__social_link_amazon',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_amazon } }
		></div>
	);
};
