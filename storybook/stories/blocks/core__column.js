/**
 * Internal dependencies
 */
import core__column from '../../../test/integration/fixtures/blocks/core__column.serialized.html';

export default {
	title: 'Blocks/core__column',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__column } }></div>;
};
