/**
 * Internal dependencies
 */
import core__missing from '../../../test/integration/fixtures/blocks/core__missing.serialized.html';

export default {
	title: 'Blocks/core__missing',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__missing } }></div>;
};
