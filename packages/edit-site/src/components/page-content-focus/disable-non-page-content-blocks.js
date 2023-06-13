/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { PAGE_CONTENT_BLOCK_TYPES } from './constants';

const { useBlockEditingMode } = unlock( blockEditorPrivateApis );

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export function DisableNonPageContentBlocks() {
	useDisableNonPageContentBlocks();
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
		const isContent = PAGE_CONTENT_BLOCK_TYPES.includes( props.name );
		const mode = isContent ? 'contentOnly' : undefined;
		useBlockEditingMode( mode );
		return <BlockEdit { ...props } />;
	},
	'withDisableNonPageContentBlocks'
);
