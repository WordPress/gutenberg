/**
 * Internal dependencies
 */
import core__verse from '../../../test/integration/fixtures/blocks/core__verse.serialized.html';

export default {
	title: 'Blocks/core__verse',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__verse } }></div>;
};
