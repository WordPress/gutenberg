/**
 * Internal dependencies
 */
import core__loginout from '../../../test/integration/fixtures/blocks/core__loginout.serialized.html';

export default {
	title: 'Blocks/core__loginout',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__loginout } }></div>;
};
