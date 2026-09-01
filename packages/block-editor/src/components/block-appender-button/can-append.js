import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Whether the block takes appended blocks through an add button, in its own
 * toolbar and in the parent selector of its children alike.
 *
 * @param {Function} select   Store select function.
 * @param {string}   clientId The block client ID.
 *
 * @return {boolean} True when an add button applies to the block.
 */
export function canAppendBlocks( select, clientId ) {
	const {
		getBlockName,
		getBlockOrder,
		getBlockListSettings,
		getBlockAttributes,
		getTemplateLock,
		getBlockEditingMode,
		isSectionBlock,
	} = unlock( select( blockEditorStore ) );

	if ( ! clientId ) {
		return false;
	}

	// An empty list shows its own appender in place, where the
	// blocks will land.
	if ( ! getBlockOrder( clientId ).length ) {
		return false;
	}

	// Only a block that renders a block list takes appended
	// blocks. The settings are registered by the list itself.
	const listSettings = getBlockListSettings( clientId );
	if ( ! listSettings ) {
		return false;
	}

	// A container that merges with the text flow (a list, a
	// quote) grows by typing: Enter continues it, and users know
	// that.
	const blockType = getBlockType( getBlockName( clientId ) );
	if (
		blockType?.merge ||
		hasBlockSupport( blockType, '__experimentalOnMerge' )
	) {
		return false;
	}

	// The button is for containers of items: a fixed child type
	// (buttons, gallery) or a horizontal or grid arrangement. A
	// freeform vertical box (group, column, cover) is a writing
	// surface and grows like one. The child restriction may be
	// declared in block.json or passed to the block list at
	// render time (the allowedBlocks attribute support, a dynamic
	// set from a plugin).
	const isItemContainer = [
		blockType?.allowedBlocks,
		listSettings.allowedBlocks,
	].some( ( allowed ) => Array.isArray( allowed ) && allowed.length > 0 );
	const layout = getBlockAttributes( clientId )?.layout;
	const isArrangement =
		layout?.type === 'grid' ||
		( layout?.type === 'flex' && layout?.orientation !== 'vertical' );
	if ( ! isItemContainer && ! isArrangement ) {
		return false;
	}

	// A section's content is locked, and a locked or disabled
	// list takes nothing.
	return (
		! isSectionBlock( clientId ) &&
		! getTemplateLock( clientId ) &&
		getBlockEditingMode( clientId ) === 'default'
	);
}
