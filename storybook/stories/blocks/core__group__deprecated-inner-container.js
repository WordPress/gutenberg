/**
 * Internal dependencies
 */
import core__group__deprecated_inner_container from '../../../test/integration/fixtures/blocks/core__group__deprecated-inner-container.serialized.html';

export default {
	title: 'Blocks/core__group__deprecated_inner_container',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__group__deprecated_inner_container,
			} }
		></div>
	);
};
