/**
 * Internal dependencies
 */
import core__categories from '../../../test/integration/fixtures/blocks/core__categories.serialized.html';

export default {
	title: 'Blocks/core__categories',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__categories } }></div>;
};
