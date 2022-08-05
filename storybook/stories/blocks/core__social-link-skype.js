/**
 * Internal dependencies
 */
import core__social_link_skype from '../../../test/integration/fixtures/blocks/core__social-link-skype.serialized.html';

export default {
	title: 'Blocks/core__social_link_skype',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_skype } }
		></div>
	);
};
