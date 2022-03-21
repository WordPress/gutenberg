/**
 * Internal dependencies
 */
import core__more__custom_text_teaser from '../../../test/integration/fixtures/blocks/core__more__custom-text-teaser.serialized.html';

export default {
	title: 'Blocks/core__more__custom_text_teaser',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__more__custom_text_teaser,
			} }
		></div>
	);
};
