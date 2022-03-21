/**
 * Internal dependencies
 */
import core__cover__solid_color from '../../../test/integration/fixtures/blocks/core__cover__solid-color.serialized.html';

export default {
	title: 'Blocks/core__cover__solid_color',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__cover__solid_color } }
		></div>
	);
};
