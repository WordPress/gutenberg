/**
 * Internal dependencies
 */
import core__navigation from '../../../test/integration/fixtures/blocks/core__navigation.serialized.html';

export default {
	title: 'Blocks/core__navigation',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__navigation } }></div>;
};
