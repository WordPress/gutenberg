/**
 * Internal dependencies
 */
import core__cover__gradient_video from '../../../test/integration/fixtures/blocks/core__cover__gradient-video.serialized.html';

export default {
	title: 'Blocks/core__cover__gradient_video',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__cover__gradient_video } }
		></div>
	);
};
