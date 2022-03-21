/**
 * Internal dependencies
 */
import core__cover__gradient_image from '../../../test/integration/fixtures/blocks/core__cover__gradient-image.serialized.html';

export default {
	title: 'Blocks/core__cover__gradient_image',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__cover__gradient_image } }
		></div>
	);
};
