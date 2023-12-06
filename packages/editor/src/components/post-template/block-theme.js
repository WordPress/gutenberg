/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import SwapTemplateButton from './swap-template-button';
import ResetDefaultTemplate from './reset-default-template';
import { unlock } from '../../lock-unlock';
import CreateNewTemplate from './create-new-template';

const POPOVER_PROPS = {
	className: 'editor-post-template__dropdown',
	placement: 'bottom-start',
};

export default function BlockThemeControl( { id } ) {
	const { isTemplateHidden } = useSelect( ( select ) => {
		const { getRenderingMode } = unlock( select( editorStore ) );
		return {
			isTemplateHidden: getRenderingMode() === 'post-only',
		};
	}, [] );
	const { editedRecord: template, hasResolved } = useEntityRecord(
		'postType',
		'wp_template',
		id
	);

	const { setRenderingMode } = useDispatch( editorStore );

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<DropdownMenu
			popoverProps={ POPOVER_PROPS }
			focusOnMount
			toggleProps={ {
				variant: 'tertiary',
				className: 'edit-site-summary-field__trigger',
			} }
			label={ __( 'Template options' ) }
			text={ decodeEntities( template.title ) }
			icon={ null }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								setRenderingMode( 'template-only' );
								onClose();
							} }
						>
							{ __( 'Edit template' ) }
						</MenuItem>
						<SwapTemplateButton onClick={ onClose } />
						<ResetDefaultTemplate onClick={ onClose } />
						<CreateNewTemplate onClick={ onClose } />
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							icon={ ! isTemplateHidden ? check : undefined }
							isPressed={ ! isTemplateHidden }
							onClick={ () => {
								setRenderingMode(
									isTemplateHidden
										? 'template-locked'
										: 'post-only'
								);
							} }
						>
							{ __( 'Template preview' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
