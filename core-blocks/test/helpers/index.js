/**
 * External dependencie
 */
import { render } from 'enzyme';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockType,
	registerBlockType,
} from '@wordpress/blocks';
// Requiredd to register the editor's store
import '@wordpress/editor';

// Hack to avoid the wrapping HoCs.
import { BlockEdit } from '../../../editor/components/block-edit';

export const blockEditRender = ( name, settings ) => {
	if ( ! getBlockType( name ) ) {
		registerBlockType( name, settings );
	}
	const block = createBlock( name );

	return render(
		<BlockEdit
			name={ name }
			isSelected={ false }
			attributes={ block.attributes }
			setAttributes={ noop }
			user={ {} }
		/>
	);
};
