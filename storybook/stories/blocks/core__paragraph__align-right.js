/**
 * Internal dependencies
 */
import core__paragraph__align_right from '../../../test/integration/fixtures/blocks/core__paragraph__align-right.serialized.html';

export default {
	title: 'Blocks/core__paragraph__align_right',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__paragraph__align_right } }
		></div>
	);
};
