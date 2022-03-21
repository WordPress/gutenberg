/**
 * Internal dependencies
 */
import core__image__center_caption from '../../../test/integration/fixtures/blocks/core__image__center-caption.serialized.html';

export default {
	title: 'Blocks/core__image__center_caption',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__image__center_caption } }
		></div>
	);
};
