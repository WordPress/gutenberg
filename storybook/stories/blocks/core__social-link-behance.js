/**
 * Internal dependencies
 */
import core__social_link_behance from '../../../test/integration/fixtures/blocks/core__social-link-behance.serialized.html';

export default {
	title: 'Blocks/core__social_link_behance',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_behance } }
		></div>
	);
};
