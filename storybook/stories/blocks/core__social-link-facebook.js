/**
 * Internal dependencies
 */
import core__social_link_facebook from '../../../test/integration/fixtures/blocks/core__social-link-facebook.serialized.html';

export default {
	title: 'Blocks/core__social_link_facebook',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_facebook } }
		></div>
	);
};
