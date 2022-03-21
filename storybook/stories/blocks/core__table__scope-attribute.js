/**
 * Internal dependencies
 */
import core__table__scope_attribute from '../../../test/integration/fixtures/blocks/core__table__scope-attribute.serialized.html';

export default {
	title: 'Blocks/core__table__scope_attribute',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__table__scope_attribute } }
		></div>
	);
};
