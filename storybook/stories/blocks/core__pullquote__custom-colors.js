/**
 * Internal dependencies
 */
import core__pullquote__custom_colors from '../../../test/integration/fixtures/blocks/core__pullquote__custom-colors.serialized.html';

export default {
	title: 'Blocks/core__pullquote__custom_colors',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__pullquote__custom_colors,
			} }
		></div>
	);
};
