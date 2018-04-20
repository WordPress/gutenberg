/**
 * External dependencie
 */
import fs from 'fs';
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
	const path = __dirname + '/../../library';
	const dirs = fs.readdirSync( path );

	dirs.forEach( ( dir ) => {
		// We only need a list of directories
		if ( fs.statSync( path + '/' + dir ).isDirectory() ) {
			// Exclude hidden directories
			if ( dir.substring( 0, 1 ) !== '.' ) {
				require( '../../library/' + dir );
			}
		}
	} );
}
