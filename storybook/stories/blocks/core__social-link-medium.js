/**
 * Internal dependencies
 */
import core__social_link_medium from '../../../test/integration/fixtures/blocks/core__social-link-medium.serialized.html';

export default {
	title: 'Blocks/core__social_link_medium',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_medium } }
		></div>
	);
};
