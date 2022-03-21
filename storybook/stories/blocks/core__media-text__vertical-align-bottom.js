/**
 * Internal dependencies
 */
import core__media_text__vertical_align_bottom from '../../../test/integration/fixtures/blocks/core__media-text__vertical-align-bottom.serialized.html';

export default {
	title: 'Blocks/core__media_text__vertical_align_bottom',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__media_text__vertical_align_bottom,
			} }
		></div>
	);
};
