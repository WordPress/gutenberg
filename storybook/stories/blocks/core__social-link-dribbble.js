/**
 * Internal dependencies
 */
import core__social_link_dribbble from '../../../test/integration/fixtures/blocks/core__social-link-dribbble.serialized.html';

export default {
	title: 'Blocks/core__social_link_dribbble',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_dribbble } }
		></div>
	);
};
