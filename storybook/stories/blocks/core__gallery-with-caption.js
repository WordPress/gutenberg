/**
 * Internal dependencies
 */
import core__gallery_with_caption from '../../../test/integration/fixtures/blocks/core__gallery-with-caption.serialized.html';

export default {
	title: 'Blocks/core__gallery_with_caption',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__gallery_with_caption } }
		></div>
	);
};
