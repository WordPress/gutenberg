/**
 * Internal dependencies
 */
import core__navigation__deprecated from '../../../test/integration/fixtures/blocks/core__navigation__deprecated.serialized.html';

export default {
	title: 'Blocks/core__navigation__deprecated',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__navigation__deprecated } }
		></div>
	);
};
