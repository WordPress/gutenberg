/**
 * Internal dependencies
 */
import core__social_link_fivehundredpx from '../../../test/integration/fixtures/blocks/core__social-link-fivehundredpx.serialized.html';

export default {
	title: 'Blocks/core__social_link_fivehundredpx',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__social_link_fivehundredpx,
			} }
		></div>
	);
};
