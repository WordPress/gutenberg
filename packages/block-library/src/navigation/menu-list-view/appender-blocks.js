import { createBlock } from '@wordpress/blocks';

/**
 * Blocks created by the task-based appender (#86177). Each task maps to an
 * existing block, so the saved markup is the same as with the block inserter.
 */

export function createPageLinkBlock() {
	return createBlock( 'core/navigation-link', {
		kind: 'post-type',
		type: 'page',
	} );
}

export function createCustomLinkBlock() {
	return createBlock( 'core/navigation-link', { kind: 'custom' } );
}

export function createPageSubmenuBlock( innerBlocks = [] ) {
	return createBlock(
		'core/navigation-submenu',
		{ kind: 'post-type', type: 'page' },
		innerBlocks
	);
}

export function createCustomLinkSubmenuBlock( innerBlocks = [] ) {
	return createBlock(
		'core/navigation-submenu',
		{ kind: 'custom' },
		innerBlocks
	);
}

export function createLabelOnlySubmenuBlock( label ) {
	return createBlock( 'core/navigation-submenu', { label } );
}
