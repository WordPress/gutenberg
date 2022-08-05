/**
 * Internal dependencies
 */
import core_buttons__simple__deprecated from '../../../test/integration/fixtures/blocks/core_buttons__simple__deprecated.serialized.html';

export default {
	title: 'Blocks/core_buttons__simple__deprecated',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core_buttons__simple__deprecated,
			} }
		></div>
	);
};
