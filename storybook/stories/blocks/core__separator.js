/**
 * Internal dependencies
 */
import core__separator from '../../../test/integration/fixtures/blocks/core__separator.serialized.html';

export default {
	title: 'Blocks/core__separator',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__separator } }></div>;
};
