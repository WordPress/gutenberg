/**
 * Internal dependencies
 */
import core__spacer__horizontal from '../../../test/integration/fixtures/blocks/core__spacer__horizontal.serialized.html';

export default {
	title: 'Blocks/core__spacer__horizontal',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__spacer__horizontal } }
		></div>
	);
};
