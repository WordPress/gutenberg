/**
 * Internal dependencies
 */
import core__columns__deprecated from '../../../test/integration/fixtures/blocks/core__columns__deprecated.serialized.html';

export default {
	title: 'Blocks/core__columns__deprecated',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__columns__deprecated } }
		></div>
	);
};
