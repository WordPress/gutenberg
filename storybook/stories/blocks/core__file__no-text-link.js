/**
 * Internal dependencies
 */
import core__file__no_text_link from '../../../test/integration/fixtures/blocks/core__file__no-text-link.serialized.html';

export default {
	title: 'Blocks/core__file__no_text_link',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__file__no_text_link } }
		></div>
	);
};
