/**
 * External dependencie
 */
import { render } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock, BlockEdit } from '../..';

export const blockEditRender = ( name, initialAttributes = {} ) => {
	const block = createBlock( name, initialAttributes );

	return render(
		<BlockEdit
			name={ name }
			focus={ false }
			attributes={ block.attributes }
			setAttributes={ noop }
		/>
	);
};
