/**
 * Internal dependencies
 */
import core__media_text__media_right_custom_width from '../../../test/integration/fixtures/blocks/core__media-text__media-right-custom-width.serialized.html';

export default {
	title: 'Blocks/core__media_text__media_right_custom_width',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__media_text__media_right_custom_width,
			} }
		></div>
	);
};
