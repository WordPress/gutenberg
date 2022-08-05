/**
 * Internal dependencies
 */
import core__social_link_deviantart from '../../../test/integration/fixtures/blocks/core__social-link-deviantart.serialized.html';

export default {
	title: 'Blocks/core__social_link_deviantart',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_deviantart } }
		></div>
	);
};
