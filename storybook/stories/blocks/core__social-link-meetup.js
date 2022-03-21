/**
 * Internal dependencies
 */
import core__social_link_meetup from '../../../test/integration/fixtures/blocks/core__social-link-meetup.serialized.html';

export default {
	title: 'Blocks/core__social_link_meetup',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_meetup } }
		></div>
	);
};
