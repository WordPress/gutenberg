/**
 * Internal dependencies
 */
import core__file__pdf_preview from '../../../test/integration/fixtures/blocks/core__file__pdf-preview.serialized.html';

export default {
	title: 'Blocks/core__file__pdf_preview',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__file__pdf_preview } }
		></div>
	);
};
