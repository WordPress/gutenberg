/**
 * Internal dependencies
 */
import core__gallery__columns from '../../../test/integration/fixtures/blocks/core__gallery__columns.serialized.html';

export default {
	title: 'Blocks/core__gallery__columns',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__gallery__columns } }
		></div>
	);
};
