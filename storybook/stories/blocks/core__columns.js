/**
 * Internal dependencies
 */
import core__columns from '../../../test/integration/fixtures/blocks/core__columns.serialized.html';

export default {
	title: 'Blocks/core__columns',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__columns } }></div>;
};
