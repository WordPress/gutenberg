/**
 * Internal dependencies
 */
import core__file__new_window from '../../../test/integration/fixtures/blocks/core__file__new-window.serialized.html';

export default {
	title: 'Blocks/core__file__new_window',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__file__new_window } }
		></div>
	);
};
