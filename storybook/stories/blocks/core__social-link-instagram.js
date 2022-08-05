/**
 * Internal dependencies
 */
import core__social_link_instagram from '../../../test/integration/fixtures/blocks/core__social-link-instagram.serialized.html';

export default {
	title: 'Blocks/core__social_link_instagram',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_instagram } }
		></div>
	);
};
