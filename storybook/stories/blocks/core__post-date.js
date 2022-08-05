/**
 * Internal dependencies
 */
import core__post_date from '../../../test/integration/fixtures/blocks/core__post-date.serialized.html';

export default {
	title: 'Blocks/core__post_date',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__post_date } }></div>;
};
