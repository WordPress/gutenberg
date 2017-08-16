/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * Retrieves the blockType from the block types config
 *
 * @param  {String}  name   Block name
 * @param  {Object}  config The block types config
 *
 * @return {?Object}        Block type
 */
export function getBlockType( name, config ) {
	return find( config.blockTypes, ( blockType ) => blockType.name === name );
}
