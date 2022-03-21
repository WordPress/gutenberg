/**
 * Internal dependencies
 */
import core__social_link_soundcloud from '../../../test/integration/fixtures/blocks/core__social-link-soundcloud.serialized.html';

export default {
	title: 'Blocks/core__social_link_soundcloud',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__social_link_soundcloud } }
		></div>
	);
};
