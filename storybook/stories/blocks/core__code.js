/**
 * Internal dependencies
 */
import core__code from '../../../test/integration/fixtures/blocks/core__code.serialized.html';

export default {
	title: 'Blocks/core__code',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__code } }></div>;
};
