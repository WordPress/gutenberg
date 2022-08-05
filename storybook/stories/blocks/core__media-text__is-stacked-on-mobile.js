/**
 * Internal dependencies
 */
import core__media_text__is_stacked_on_mobile from '../../../test/integration/fixtures/blocks/core__media-text__is-stacked-on-mobile.serialized.html';

export default {
	title: 'Blocks/core__media_text__is_stacked_on_mobile',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__media_text__is_stacked_on_mobile,
			} }
		></div>
	);
};
