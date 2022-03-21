/**
 * Internal dependencies
 */
import core__query from '../../../test/integration/fixtures/blocks/core__query.serialized.html';

export default {
	title: 'Blocks/core__query',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__query } }></div>;
};
