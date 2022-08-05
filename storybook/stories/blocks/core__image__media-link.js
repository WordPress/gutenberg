/**
 * Internal dependencies
 */
import core__image__media_link from '../../../test/integration/fixtures/blocks/core__image__media-link.serialized.html';

export default {
	title: 'Blocks/core__image__media_link',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__image__media_link } }
		></div>
	);
};
