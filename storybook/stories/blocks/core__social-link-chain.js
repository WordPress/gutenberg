/**
 * Internal dependencies
 */
import core__social_link_chain from '../../../test/integration/fixtures/blocks/core__social-link-chain.serialized.html';

export default {
	title: 'Blocks/core__social_link_chain',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_chain } }
		></div>
	);
};
