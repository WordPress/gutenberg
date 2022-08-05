/**
 * Internal dependencies
 */
import core__image__attachment_link from '../../../test/integration/fixtures/blocks/core__image__attachment-link.serialized.html';

export default {
	title: 'Blocks/core__image__attachment_link',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__image__attachment_link } }
		></div>
	);
};
