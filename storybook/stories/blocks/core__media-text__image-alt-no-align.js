/**
 * Internal dependencies
 */
import core__media_text__image_alt_no_align from '../../../test/integration/fixtures/blocks/core__media-text__image-alt-no-align.serialized.html';

export default {
	title: 'Blocks/core__media_text__image_alt_no_align',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__media_text__image_alt_no_align,
			} }
		></div>
	);
};
