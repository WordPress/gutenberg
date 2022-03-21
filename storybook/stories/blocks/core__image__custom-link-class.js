/**
 * Internal dependencies
 */
import core__image__custom_link_class from '../../../test/integration/fixtures/blocks/core__image__custom-link-class.serialized.html';

export default {
	title: 'Blocks/core__image__custom_link_class',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__image__custom_link_class,
			} }
		></div>
	);
};
