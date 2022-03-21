/**
 * Internal dependencies
 */
import core__nextpage from '../../../test/integration/fixtures/blocks/core__nextpage.serialized.html';

export default {
	title: 'Blocks/core__nextpage',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__nextpage } }></div>;
};
