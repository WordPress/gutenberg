/**
 * Internal dependencies
 */
import core__social_link_bandcamp from '../../../test/integration/fixtures/blocks/core__social-link-bandcamp.serialized.html';

export default {
	title: 'Blocks/core__social_link_bandcamp',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_bandcamp } }
		></div>
	);
};
