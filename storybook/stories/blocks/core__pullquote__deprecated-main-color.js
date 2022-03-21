/**
 * Internal dependencies
 */
import core__pullquote__deprecated_main_color from '../../../test/integration/fixtures/blocks/core__pullquote__deprecated-main-color.serialized.html';

export default {
	title: 'Blocks/core__pullquote__deprecated_main_color',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__pullquote__deprecated_main_color,
			} }
		></div>
	);
};
