/**
 * Internal dependencies
 */
import core__list__ul from '../../../test/integration/fixtures/blocks/core__list__ul.serialized.html';

export default {
	title: 'Blocks/core__list__ul',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__list__ul } }></div>;
};
