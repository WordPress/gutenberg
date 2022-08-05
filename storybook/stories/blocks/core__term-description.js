/**
 * Internal dependencies
 */
import core__term_description from '../../../test/integration/fixtures/blocks/core__term-description.serialized.html';

export default {
	title: 'Blocks/core__term_description',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__term_description } }
		></div>
	);
};
