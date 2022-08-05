/**
 * Internal dependencies
 */
import core__social_link_youtube from '../../../test/integration/fixtures/blocks/core__social-link-youtube.serialized.html';

export default {
	title: 'Blocks/core__social_link_youtube',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_youtube } }
		></div>
	);
};
