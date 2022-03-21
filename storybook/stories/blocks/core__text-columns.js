/**
 * Internal dependencies
 */
import core__text_columns from '../../../test/integration/fixtures/blocks/core__text-columns.serialized.html';

export default {
	title: 'Blocks/core__text_columns',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__text_columns } }></div>
	);
};
