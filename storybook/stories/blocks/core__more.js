/**
 * Internal dependencies
 */
import core__more from '../../../test/integration/fixtures/blocks/core__more.serialized.html';

export default {
	title: 'Blocks/core__more',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__more } }></div>;
};
