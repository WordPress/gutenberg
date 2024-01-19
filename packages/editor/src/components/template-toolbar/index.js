/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	ToolbarGroup,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { NavigableToolbar, BlockIcon } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function TemplateToolbar() {
	const { icon: templateIcon, title: templateTitle } = useSelect(
		( select ) => {
			const templateId = select( editorStore ).getCurrentTemplateId();
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_template',
				templateId
			);
			return select( editorStore ).__experimentalGetTemplateInfo(
				record
			);
		}
	);
	const { setRenderingMode } = useDispatch( editorStore );
	return (
		<NavigableToolbar
			className="editor-template-toolbar"
			aria-label={ __( 'Template tools' ) }
		>
			<ToolbarGroup>
				<HStack
					className="editor-template-toolbar__title"
					spacing={ 1 }
				>
					<BlockIcon icon={ templateIcon } />
					<Text>{ templateTitle }</Text>
				</HStack>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton
					onClick={ () => setRenderingMode( 'template-only' ) }
				>
					{ __( 'Edit template' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</NavigableToolbar>
	);
}
