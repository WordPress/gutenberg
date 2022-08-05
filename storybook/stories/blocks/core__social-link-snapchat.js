/**
 * Internal dependencies
 */
import core__social_link_snapchat from '../../../test/integration/fixtures/blocks/core__social-link-snapchat.serialized.html';

export default {
	title: 'Blocks/core__social_link_snapchat',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_snapchat } }
		></div>
	);
};
