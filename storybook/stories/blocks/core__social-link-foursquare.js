/**
 * Internal dependencies
 */
import core__social_link_foursquare from '../../../test/integration/fixtures/blocks/core__social-link-foursquare.serialized.html';

export default {
	title: 'Blocks/core__social_link_foursquare',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_foursquare } }
		></div>
	);
};
