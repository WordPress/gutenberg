/**
 * Internal dependencies
 */
import core__social_link_yelp from '../../../test/integration/fixtures/blocks/core__social-link-yelp.serialized.html';

export default {
	title: 'Blocks/core__social_link_yelp',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_yelp } }
		></div>
	);
};
