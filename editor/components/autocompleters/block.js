/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockIcon from '../block-icon';

function defaultGetBlockInsertionPoint() {
	return select( 'core/editor' ).getBlockInsertionPoint();
}

function defaultGetInserterItems( { rootUID } ) {
	return select( 'core/editor' ).getInserterItems( rootUID );
}

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {Completer} A blocks completer.
 */
export function createBlockCompleter( {
	// Allow store-based selectors to be overridden for unit test.
	getBlockInsertionPoint = defaultGetBlockInsertionPoint,
	getInserterItems = defaultGetInserterItems,
} = {} ) {
	return {
		name: 'blocks',
		className: 'editor-autocompleters__block',
		triggerPrefix: '/',
		options() {
			return getInserterItems( getBlockInsertionPoint() );
		},
		getOptionKeywords( inserterItem ) {
			const { title, keywords = [] } = inserterItem;
			return [ ...keywords, title ];
		},
		getOptionLabel( inserterItem ) {
			const { icon, title } = inserterItem;
			return [
				<BlockIcon key="icon" icon={ icon && icon.src } />,
				title,
			];
		},
		allowContext( before, after ) {
			return ! ( /\S/.test( before.toString() ) || /\S/.test( after.toString() ) );
		},
		getOptionCompletion( inserterItem ) {
			const { name, initialAttributes } = inserterItem;
			return {
				action: 'replace',
				value: createBlock( name, initialAttributes ),
			};
		},
		isOptionDisabled( inserterItem ) {
			return inserterItem.isDisabled;
		},
	};
}

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {Completer} A blocks completer.
 */
export default createBlockCompleter();
