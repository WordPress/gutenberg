/**
 * Internal dependencies
 */
import core__block from '../../../test/integration/fixtures/blocks/core__block.serialized.html';

export default {
	title: 'Blocks/core__block',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__block } }></div>;
};
