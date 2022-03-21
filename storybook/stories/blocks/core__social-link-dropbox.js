/**
 * Internal dependencies
 */
import core__social_link_dropbox from '../../../test/integration/fixtures/blocks/core__social-link-dropbox.serialized.html';

export default {
	title: 'Blocks/core__social_link_dropbox',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_dropbox } }
		></div>
	);
};
