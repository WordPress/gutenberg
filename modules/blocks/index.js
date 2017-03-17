export { default as Editable } from './components/editable';

const blocks = {};

/**
 * Registers a block.
 *
 * @param  {string} namespace Block grouping unique to package or plugin
 * @param  {string} block     Block name
 * @param  {Object} settings  Block settings
 */
export function registerBlock( namespace, block, settings ) {
	if ( ! blocks.namespace ) {
		blocks[ namespace ] = {};
	}

	blocks[ namespace ][ block ] = Object.assign(
		{ name: block, namespace },
		settings
	);
}

/**
 * Returns settings associated with a block.
 *
 * @param  {string}  namespace Block grouping unique to package or plugin
 * @param  {string}  block     Block name
 * @return {?Object}           Block settings
 */
export function getBlockSettings( namespace, block ) {
	if ( ! blocks[ namespace ] || ! blocks[ namespace ][ block ] ) {
		return null;
	}

	return blocks[ namespace ][ block ];
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Blocks settings
 */
export function getBlocks() {
	return Object.values( blocks ).reduce( ( memo, namespaceBlocks ) => {
		return memo.concat( Object.values( namespaceBlocks ) );
	} );
}
