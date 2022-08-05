/**
 * Internal dependencies
 */
import core__image__custom_link_rel from '../../../test/integration/fixtures/blocks/core__image__custom-link-rel.serialized.html';

export default {
	title: 'Blocks/core__image__custom_link_rel',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__image__custom_link_rel } }
		></div>
	);
};
