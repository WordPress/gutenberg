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
import { unlock } from '../../private-apis';
import { CONTENT_BLOCK_TYPES } from './constants';

const { useBlockEditingMode } = unlock( blockEditorPrivateApis );

/**
 * Disables non-content blocks using the `useBlockEditingMode` hook.
 */
export function useDisableNonContentBlocks() {
	useBlockEditingMode( 'disabled' );
	useEffect( () => {
		addFilter(
			'editor.BlockEdit',
			'core/edit-site/disable-non-content-blocks',
			withDisableNonContentBlocks
		);
		return () =>
			removeFilter(
				'editor.BlockEdit',
				'core/edit-site/disable-non-content-blocks'
			);
	}, [] );
}

const withDisableNonContentBlocks = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isContent = CONTENT_BLOCK_TYPES.includes( props.name );
		const mode = isContent ? 'contentOnly' : undefined;
		useBlockEditingMode( mode );
		return <BlockEdit { ...props } />;
	},
	'withBlockEditingMode'
);
