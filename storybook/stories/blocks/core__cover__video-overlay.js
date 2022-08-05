/**
 * Internal dependencies
 */
import core__cover__video_overlay from '../../../test/integration/fixtures/blocks/core__cover__video-overlay.serialized.html';

export default {
	title: 'Blocks/core__cover__video_overlay',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__cover__video_overlay } }
		></div>
	);
};
