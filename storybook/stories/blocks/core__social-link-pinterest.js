/**
 * Internal dependencies
 */
import core__social_link_pinterest from '../../../test/integration/fixtures/blocks/core__social-link-pinterest.serialized.html';

export default {
	title: 'Blocks/core__social_link_pinterest',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_pinterest } }
		></div>
	);
};
