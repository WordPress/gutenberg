/**
 * Internal dependencies
 */
import core__group__deprecated from '../../../test/integration/fixtures/blocks/core__group__deprecated.serialized.html';

export default {
	title: 'Blocks/core__group__deprecated',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__group__deprecated } }
		></div>
	);
};
