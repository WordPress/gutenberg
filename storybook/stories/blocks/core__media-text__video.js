/**
 * Internal dependencies
 */
import core__media_text__video from '../../../test/integration/fixtures/blocks/core__media-text__video.serialized.html';

export default {
	title: 'Blocks/core__media_text__video',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__media_text__video } }
		></div>
	);
};
