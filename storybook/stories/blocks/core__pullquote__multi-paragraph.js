/**
 * Internal dependencies
 */
import core__pullquote__multi_paragraph from '../../../test/integration/fixtures/blocks/core__pullquote__multi-paragraph.serialized.html';

export default {
	title: 'Blocks/core__pullquote__multi_paragraph',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__pullquote__multi_paragraph,
			} }
		></div>
	);
};
