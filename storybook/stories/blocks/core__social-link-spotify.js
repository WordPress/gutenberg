/**
 * Internal dependencies
 */
import core__social_link_spotify from '../../../test/integration/fixtures/blocks/core__social-link-spotify.serialized.html';

export default {
	title: 'Blocks/core__social_link_spotify',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_spotify } }
		></div>
	);
};
