/**
 * Internal dependencies
 */
import core__social_link_wordpress from '../../../test/integration/fixtures/blocks/core__social-link-wordpress.serialized.html';

export default {
	title: 'Blocks/core__social_link_wordpress',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_wordpress } }
		></div>
	);
};
