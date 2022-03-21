/**
 * Internal dependencies
 */
import core__query_title from '../../../test/integration/fixtures/blocks/core__query-title.serialized.html';

export default {
	title: 'Blocks/core__query_title',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__query_title } }></div>
	);
};
