/**
 * Internal dependencies
 */
import core__social_link_github from '../../../test/integration/fixtures/blocks/core__social-link-github.serialized.html';

export default {
	title: 'Blocks/core__social_link_github',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_github } }
		></div>
	);
};
