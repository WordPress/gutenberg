/**
 * Internal dependencies
 */
import core__group from '../../../test/integration/fixtures/blocks/core__group.serialized.html';

export default {
	title: 'Blocks/core__group',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__group } }></div>;
};
