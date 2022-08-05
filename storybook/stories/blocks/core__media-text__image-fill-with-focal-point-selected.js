/**
 * Internal dependencies
 */
import core__media_text__image_fill_with_focal_point_selected from '../../../test/integration/fixtures/blocks/core__media-text__image-fill-with-focal-point-selected.serialized.html';

export default {
	title: 'Blocks/core__media_text__image_fill_with_focal_point_selected',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__media_text__image_fill_with_focal_point_selected,
			} }
		></div>
	);
};
