/**
 * Internal dependencies
 */
import core__pattern from '../../../test/integration/fixtures/blocks/core__pattern.serialized.html';

export default {
	title: 'Blocks/core__pattern',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__pattern } }></div>;
};
