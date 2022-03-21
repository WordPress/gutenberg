/**
 * Internal dependencies
 */
import core__navigation_link from '../../../test/integration/fixtures/blocks/core__navigation-link.serialized.html';

export default {
	title: 'Blocks/core__navigation_link',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__navigation_link } }
		></div>
	);
};
