/**
 * Internal dependencies
 */
import core__freeform from '../../../test/integration/fixtures/blocks/core__freeform.serialized.html';

export default {
	title: 'Blocks/core__freeform',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__freeform } }></div>;
};
