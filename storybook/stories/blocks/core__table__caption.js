/**
 * Internal dependencies
 */
import core__table__caption from '../../../test/integration/fixtures/blocks/core__table__caption.serialized.html';

export default {
	title: 'Blocks/core__table__caption',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__table__caption } }></div>
	);
};
