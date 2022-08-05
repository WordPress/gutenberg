/**
 * Internal dependencies
 */
import core__cover__video from '../../../test/integration/fixtures/blocks/core__cover__video.serialized.html';

export default {
	title: 'Blocks/core__cover__video',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__cover__video } }></div>
	);
};
