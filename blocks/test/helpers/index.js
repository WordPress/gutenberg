/**
 * External dependencie
 */
import { render } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import {
	createBlock,
	getBlockType,
	registerBlockType,
} from '../..';
import { BlockEdit } from '../../block-edit';
import { withBlockEditContextProvider } from '../../block-edit/context';

const BlockEditWithContext = withBlockEditContextProvider( BlockEdit );

export const blockEditRender = ( name, settings ) => {
	if ( ! getBlockType( name ) ) {
		registerBlockType( name, settings );
	}
	const block = createBlock( name );

	return render(
		<BlockEditWithContext
			name={ name }
			isSelected={ false }
			attributes={ block.attributes }
			setAttributes={ noop }
			user={ {} }
			createInnerBlockList={ noop }
		/>
	);
};
