/**
 * Internal dependencies
 */
import core__navigation_area from '../../../test/integration/fixtures/blocks/core__navigation-area.serialized.html';

export default {
	title: 'Blocks/core__navigation_area',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__navigation_area } }
		></div>
	);
};
