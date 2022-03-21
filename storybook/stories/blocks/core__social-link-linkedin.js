/**
 * Internal dependencies
 */
import core__social_link_linkedin from '../../../test/integration/fixtures/blocks/core__social-link-linkedin.serialized.html';

export default {
	title: 'Blocks/core__social_link_linkedin',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_linkedin } }
		></div>
	);
};
