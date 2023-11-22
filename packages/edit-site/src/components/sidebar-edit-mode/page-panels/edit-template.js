/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import SwapTemplateButton from './swap-template-button';
import ResetDefaultTemplate from './reset-default-template';
import { unlock } from '../../../lock-unlock';
import { PAGE_CONTENT_BLOCK_TYPES } from '../../../utils/constants';

const { PostPanelRow } = unlock( editorPrivateApis );

const POPOVER_PROPS = {
	className: 'edit-site-page-panels-edit-template__dropdown',
	placement: 'bottom-start',
};

export default function EditTemplate() {
	const { hasPostContentBlocks, hasResolved, template, isTemplateHidden } =
		useSelect( ( select ) => {
			const { getEditedPostContext, getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getCanvasMode, getPageContentFocusType } = unlock(
				select( editSiteStore )
			);
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const { __experimentalGetGlobalBlocksByName } =
				select( blockEditorStore );
			const _context = getEditedPostContext();
			const _postType = getEditedPostType();
			const queryArgs = [ 'postType', _postType, getEditedPostId() ];
			return {
				hasPostContentBlocks: !! __experimentalGetGlobalBlocksByName(
					Object.keys( PAGE_CONTENT_BLOCK_TYPES )
				).length,
				context: _context,
				hasResolved: hasFinishedResolution(
					'getEditedEntityRecord',
					queryArgs
				),
				template: getEditedEntityRecord( ...queryArgs ),
				isTemplateHidden:
					getCanvasMode() === 'edit' &&
					getPageContentFocusType() === 'hideTemplate',
				postType: _postType,
			};
		}, [] );

	const { setHasPageContentFocus } = useDispatch( editSiteStore );
	// Disable reason: `useDispatch` can't be called conditionally.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { setPageContentFocusType } = unlock( useDispatch( editSiteStore ) );

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
									setHasPageContentFocus( false );
									onClose();
								} }
							>
								{ __( 'Edit template' ) }
							</MenuItem>
							<SwapTemplateButton onClick={ onClose } />
						</MenuGroup>
						<ResetDefaultTemplate onClick={ onClose } />
						{ hasPostContentBlocks && (
							<MenuGroup>
								<MenuItem
									icon={
										! isTemplateHidden ? check : undefined
									}
									isPressed={ ! isTemplateHidden }
									onClick={ () => {
										setPageContentFocusType(
											isTemplateHidden
												? 'disableTemplate'
												: 'hideTemplate'
										);
									} }
								>
									{ __( 'Template preview' ) }
								</MenuItem>
							</MenuGroup>
						) }
					</>
				) }
			</DropdownMenu>
		</PostPanelRow>
	);
}
