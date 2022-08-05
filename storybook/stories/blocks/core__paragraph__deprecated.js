/**
 * Internal dependencies
 */
import core__paragraph__deprecated from '../../../test/integration/fixtures/blocks/core__paragraph__deprecated.serialized.html';

export default {
	title: 'Blocks/core__paragraph__deprecated',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__paragraph__deprecated } }
		></div>
	);
};
