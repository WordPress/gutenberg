/**
 * Internal dependencies
 */
import core__search__custom_text from '../../../test/integration/fixtures/blocks/core__search__custom-text.serialized.html';

export default {
	title: 'Blocks/core__search__custom_text',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__search__custom_text } }
		></div>
	);
};
