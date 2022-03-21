/**
 * Internal dependencies
 */
import core__social_link_mail from '../../../test/integration/fixtures/blocks/core__social-link-mail.serialized.html';

export default {
	title: 'Blocks/core__social_link_mail',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_mail } }
		></div>
	);
};
