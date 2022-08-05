/**
 * Internal dependencies
 */
import core__buttons from '../../../test/integration/fixtures/blocks/core__buttons.serialized.html';

export default {
	title: 'Blocks/core__buttons',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__buttons } }></div>;
};
