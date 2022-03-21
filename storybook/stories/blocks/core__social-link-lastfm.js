/**
 * Internal dependencies
 */
import core__social_link_lastfm from '../../../test/integration/fixtures/blocks/core__social-link-lastfm.serialized.html';

export default {
	title: 'Blocks/core__social_link_lastfm',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_lastfm } }
		></div>
	);
};
