/**
 * Internal dependencies
 */
import core__cover__gradient from '../../../test/integration/fixtures/blocks/core__cover__gradient.serialized.html';

export default {
	title: 'Blocks/core__cover__gradient',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__cover__gradient } }
		></div>
	);
};
