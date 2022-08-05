/**
 * Internal dependencies
 */
import core__social_link_etsy from '../../../test/integration/fixtures/blocks/core__social-link-etsy.serialized.html';

export default {
	title: 'Blocks/core__social_link_etsy',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_etsy } }
		></div>
	);
};
