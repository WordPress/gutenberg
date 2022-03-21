/**
 * Internal dependencies
 */
import core__video from '../../../test/integration/fixtures/blocks/core__video.serialized.html';

export default {
	title: 'Blocks/core__video',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__video } }></div>;
};
