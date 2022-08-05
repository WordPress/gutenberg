/**
 * Internal dependencies
 */
import core__calendar from '../../../test/integration/fixtures/blocks/core__calendar.serialized.html';

export default {
	title: 'Blocks/core__calendar',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__calendar } }></div>;
};
