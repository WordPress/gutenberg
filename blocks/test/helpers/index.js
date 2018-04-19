/**
 * External dependencie
 */
import { render } from 'enzyme';
import { noop } from 'lodash';
import { readdirSync } from 'fs';

/**
 * Internal dependencies
 */
import {
	createBlock,
	getBlockType,
	registerBlockType,
} from '../..';
import { BlockEdit } from '../../block-edit';

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
			createInnerBlockList={ noop }
		/>
	);
};

export function registerCoreBlocks() {
	const dirs = readdirSync( __dirname + '/../../library' );

	dirs.forEach( ( dir ) => {
		if ( ! dir.includes( '.' ) ) {
			require( '../../library/' + dir );
		}
	} );
}
