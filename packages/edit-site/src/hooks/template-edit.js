/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';

function EditTemplateMenuItem() {
	const { setRenderingMode } = useDispatch( editorStore );
	return (
		<BlockControls group="other">
			<ToolbarButton
				onClick={ () => setRenderingMode( 'template-only' ) }
			>
				{ __( 'Edit template' ) }
			</ToolbarButton>
		</BlockControls>
	);
}

export const withEditBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name } = props;
		return (
			<>
				<BlockEdit { ...props } />
				{ name === 'core/template' && <EditTemplateMenuItem /> }
			</>
		);
	},
	'withEditBlockControls'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/template-edit-button',
	withEditBlockControls
);
