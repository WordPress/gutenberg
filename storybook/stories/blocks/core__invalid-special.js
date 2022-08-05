/**
 * Internal dependencies
 */
import core__invalid_special from '../../../test/integration/fixtures/blocks/core__invalid-special.serialized.html';

export default {
	title: 'Blocks/core__invalid_special',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__invalid_special } }
		></div>
	);
};
