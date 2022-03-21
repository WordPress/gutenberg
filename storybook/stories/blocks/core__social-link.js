/**
 * Internal dependencies
 */
import core__social_link from '../../../test/integration/fixtures/blocks/core__social-link.serialized.html';

export default {
	title: 'Blocks/core__social_link',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__social_link } }></div>
	);
};
