/**
 * Internal dependencies
 */
import core__heading__h2_color from '../../../test/integration/fixtures/blocks/core__heading__h2-color.serialized.html';

export default {
	title: 'Blocks/core__heading__h2_color',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__heading__h2_color } }
		></div>
	);
};
