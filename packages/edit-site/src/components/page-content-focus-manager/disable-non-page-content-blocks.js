/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { useBlockEditingMode } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */

const PAGE_CONTENT_BLOCK_TYPES = [
	'core/post-title',
	'core/post-featured-image',
	'core/post-content',
];

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	useDisableNonPageContentBlocks();
	return null;
}

/**
 * Disables non-content blocks using the `useBlockEditingMode` hook.
 */
export function useDisableNonPageContentBlocks() {
	useBlockEditingMode( 'disabled' );
	useEffect( () => {
		addFilter(
			'editor.BlockEdit',
			'core/edit-site/disable-non-content-blocks',
			withDisableNonPageContentBlocks
		);
		return () =>
			removeFilter(
				'editor.BlockEdit',
				'core/edit-site/disable-non-content-blocks'
			);
	}, [] );
}

const withDisableNonPageContentBlocks = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isDescendentOfQueryLoop = props.context.queryId !== undefined;
		const isPageContent =
			PAGE_CONTENT_BLOCK_TYPES.includes( props.name ) &&
			! isDescendentOfQueryLoop;
		const mode = isPageContent ? 'contentOnly' : undefined;
		useBlockEditingMode( mode );
		return <BlockEdit { ...props } />;
	},
	'withDisableNonPageContentBlocks'
);
