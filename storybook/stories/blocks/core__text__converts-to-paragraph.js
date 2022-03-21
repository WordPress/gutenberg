/**
 * Internal dependencies
 */
import core__text__converts_to_paragraph from '../../../test/integration/fixtures/blocks/core__text__converts-to-paragraph.serialized.html';

export default {
	title: 'Blocks/core__text__converts_to_paragraph',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__text__converts_to_paragraph,
			} }
		></div>
	);
};
