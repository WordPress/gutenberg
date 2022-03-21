/**
 * Internal dependencies
 */
import core__social_link_codepen from '../../../test/integration/fixtures/blocks/core__social-link-codepen.serialized.html';

export default {
	title: 'Blocks/core__social_link_codepen',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_codepen } }
		></div>
	);
};
