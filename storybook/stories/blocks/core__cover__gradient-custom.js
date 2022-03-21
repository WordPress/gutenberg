/**
 * Internal dependencies
 */
import core__cover__gradient_custom from '../../../test/integration/fixtures/blocks/core__cover__gradient-custom.serialized.html';

export default {
	title: 'Blocks/core__cover__gradient_custom',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__cover__gradient_custom } }
		></div>
	);
};
