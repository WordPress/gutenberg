/**
 * External dependencies
 */
import { sortBy, once } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { createBlock, getBlockTypes } from '../api';
import BlockIcon from '../block-icon';

/**
 * A blocks repeater for replacing the current block with a selected block type.
 *
 * @type {Completer}
 */
export default {
	name: 'blocks',
	className: 'blocks-autocompleters__block',
	triggerPrefix: '/',
	options: once( function options() {
		return Promise.resolve(
			// Prioritize common category in block type options
			sortBy(
				getBlockTypes(),
				( { category } ) => 'common' !== category
			)
		);
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
