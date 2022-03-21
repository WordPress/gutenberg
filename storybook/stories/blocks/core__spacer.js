/**
 * Internal dependencies
 */
import core__spacer from '../../../test/integration/fixtures/blocks/core__spacer.serialized.html';

export default {
	title: 'Blocks/core__spacer',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__spacer } }></div>;
};
