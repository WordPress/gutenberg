/**
 * Internal dependencies
 */
import core__archives from '../../../test/integration/fixtures/blocks/core__archives.serialized.html';

export default {
	title: 'Blocks/core__archives',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__archives } }></div>;
};
