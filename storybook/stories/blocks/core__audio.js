/**
 * Internal dependencies
 */
import core__audio from '../../../test/integration/fixtures/blocks/core__audio.serialized.html';

export default {
	title: 'Blocks/core__audio',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__audio } }></div>;
};
