/**
 * Internal dependencies
 */
import core__image__deprecated_align_wrapper from '../../../test/integration/fixtures/blocks/core__image__deprecated-align-wrapper.serialized.html';

export default {
	title: 'Blocks/core__image__deprecated_align_wrapper',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__image__deprecated_align_wrapper,
			} }
		></div>
	);
};
