/**
 * Internal dependencies
 */
import core__table from '../../../test/integration/fixtures/blocks/core__table.serialized.html';

export default {
	title: 'Blocks/core__table',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__table } }></div>;
};
