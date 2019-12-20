/**
 * Returns a string containing the block title associated with the provided block name.
 *
 * @param {string} blockName Block name.
 * @param {string} setting   Block setting e.g: title, attributes....
 *
 * @return {Promise} Promise resolving with a string containing the block title.
 */
export async function getBlockSetting( blockName, setting ) {
	return page.evaluate( ( _blockName, _setting ) => {
		const blockType = wp.data.select( 'core/blocks' ).getBlockType( _blockName );
		return blockType && blockType[ _setting ];
	}, blockName, setting );
}
