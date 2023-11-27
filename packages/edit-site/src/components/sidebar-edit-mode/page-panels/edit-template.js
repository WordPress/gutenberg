/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';
import {
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import SwapTemplateButton from './swap-template-button';
import ResetDefaultTemplate from './reset-default-template';
import { unlock } from '../../../lock-unlock';

const { PostPanelRow } = unlock( editorPrivateApis );

const POPOVER_PROPS = {
	className: 'edit-site-page-panels-edit-template__dropdown',
	placement: 'bottom-start',
};

export default function EditTemplate() {
	const { hasResolved, template, isTemplateHidden } = useSelect(
		( select ) => {
			const { getEditedPostContext, getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getRenderingMode } = unlock( select( editorStore ) );
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const _context = getEditedPostContext();
			const _postType = getEditedPostType();
			const queryArgs = [ 'postType', _postType, getEditedPostId() ];
			return {
				context: _context,
				hasResolved: hasFinishedResolution(
					'getEditedEntityRecord',
					queryArgs
				),
				template: getEditedEntityRecord( ...queryArgs ),
				isTemplateHidden: getRenderingMode() === 'post-only',
				postType: _postType,
			};
		},
		[]
	);

	const { setRenderingMode } = useDispatch( editorStore );

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<PostPanelRow label={ __( 'Template' ) }>
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
						</MenuGroup>
						<ResetDefaultTemplate onClick={ onClose } />
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
		</PostPanelRow>
	);
}
