/**
 * External dependencies
 */
import { filter, sortBy, once, flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock, getBlockTypes, hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockIcon from '../block-icon';

function filterBlockTypes( blockTypes ) {
	// Exclude blocks that don't support being shown in the inserter
	return filter( blockTypes, ( blockType ) => hasBlockSupport( blockType, 'inserter', true ) );
}

function sortBlockTypes( blockTypes ) {
	// Prioritize blocks in the common common category
	return sortBy( blockTypes, ( { category } ) => 'common' !== category );
}

/**
 * A blocks repeater for replacing the current block with a selected block type.
 *
 * @type {Completer}
 */
export default {
	name: 'blocks',
	className: 'editor-autocompleters__block',
	triggerPrefix: '/',
	options: once( function options() {
		return Promise.resolve( flow( filterBlockTypes, sortBlockTypes )( getBlockTypes() ) );
	} ),
	getOptionKeywords( blockSettings ) {
		const { title, keywords = [] } = blockSettings;
		return [ ...keywords, title ];
	},
	getOptionLabel( blockSettings ) {
		const { icon, title } = blockSettings;
		return [
			<BlockIcon key="icon" icon={ icon } />,
			title,
		];
	},
	allowContext( before, after ) {
		return ! ( /\S/.test( before.toString() ) || /\S/.test( after.toString() ) );
	},
	getOptionCompletion( blockData ) {
		return {
			action: 'replace',
			value: createBlock( blockData.name ),
		};
	},
};
