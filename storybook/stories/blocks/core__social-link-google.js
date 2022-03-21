/**
 * Internal dependencies
 */
import core__social_link_google from '../../../test/integration/fixtures/blocks/core__social-link-google.serialized.html';

export default {
	title: 'Blocks/core__social_link_google',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_google } }
		></div>
	);
};
