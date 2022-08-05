/**
 * Internal dependencies
 */
import core__navigation_submenu from '../../../test/integration/fixtures/blocks/core__navigation-submenu.serialized.html';

export default {
	title: 'Blocks/core__navigation_submenu',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__navigation_submenu } }
		></div>
	);
};
