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

function defaultGetInserterItems( parentUID ) {
	// TODO: Update call to getInserterItems when the child block support PR is merged and that function simplified.
	const {
		getEditorSettings,
		getSupportedBlocks,
		getInserterItems,
	} = select( 'core/editor' );
	const supportedBlocks = getSupportedBlocks( parentUID, getEditorSettings().allowedBlockTypes );
	return getInserterItems( supportedBlocks );
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
				<BlockIcon key="icon" icon={ icon } />,
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
	};
}

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {Completer} A blocks completer.
 */
export default createBlockCompleter();
