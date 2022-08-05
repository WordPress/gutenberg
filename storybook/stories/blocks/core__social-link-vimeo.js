/**
 * Internal dependencies
 */
import core__social_link_vimeo from '../../../test/integration/fixtures/blocks/core__social-link-vimeo.serialized.html';

export default {
	title: 'Blocks/core__social_link_vimeo',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_vimeo } }
		></div>
	);
};
