/**
 * Internal dependencies
 */
import core__columns__is_not_stacked_on_mobile from '../../../test/integration/fixtures/blocks/core__columns__is-not-stacked-on-mobile.serialized.html';

export default {
	title: 'Blocks/core__columns__is_not_stacked_on_mobile',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__columns__is_not_stacked_on_mobile,
			} }
		></div>
	);
};
