/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
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
		const mode = useSelect(
			( select ) => {
				if ( CONTENT_BLOCK_TYPES.includes( props.name ) ) {
					return 'contentOnly';
				}
				if (
					select( blockEditorStore ).getBlockParentsByBlockName(
						props.clientId,
						'core/post-content'
					).length
				) {
					return 'default';
				}
			},
			[ props.name, props.clientId ]
		);
		useBlockEditingMode( mode );
		return <BlockEdit { ...props } />;
	},
	'withBlockEditingMode'
);
