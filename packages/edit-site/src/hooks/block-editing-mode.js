/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../private-apis';

const { useBlockEditingMode } = unlock( blockEditorPrivateApis );

export const withBlockEditingMode = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const mode = useSelect( ( select ) => {
			if (
				[
					'core/post-title',
					'core/post-featured-image',
					'core/post-content',
				].includes( props.name )
			) {
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
		} );
		useBlockEditingMode( mode );
		return <BlockEdit { ...props } />;
	},
	'withBlockEditingMode'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/block-editing-mode',
	withBlockEditingMode
);
