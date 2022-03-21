/**
 * Internal dependencies
 */
import core__heading_align_textalign from '../../../test/integration/fixtures/blocks/core__heading_align-textalign.serialized.html';

export default {
	title: 'Blocks/core__heading_align_textalign',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__heading_align_textalign,
			} }
		></div>
	);
};
