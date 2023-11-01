/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import SwapTemplateButton from './swap-template-button';
import ResetDefaultTemplate from './reset-default-template';
import { unlock } from '../../../lock-unlock';
import usePageContentBlocks from '../../block-editor/block-editor-provider/use-page-content-blocks';

const POPOVER_PROPS = {
	className: 'edit-site-page-panels-edit-template__dropdown',
	placement: 'bottom-start',
};

export default function EditTemplate() {
	const { hasResolved, template, isTemplateHidden, postType } = useSelect(
		( select ) => {
			const { getEditedPostContext, getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getCanvasMode, getPageContentFocusType } = unlock(
				select( editSiteStore )
			);
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const _context = getEditedPostContext();
			const _postType = getEditedPostType();
			const queryArgs = [
				'postType',
				getEditedPostType(),
				getEditedPostId(),
			];

			return {
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
		},
		[]
	);

	const [ blocks ] = useEntityBlockEditor( 'postType', postType );

	const { setHasPageContentFocus } = useDispatch( editSiteStore );
	// Disable reason: `useDispatch` can't be called conditionally.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { setPageContentFocusType } = unlock( useDispatch( editSiteStore ) );
	// Check if there are any post content block types in the blocks tree.
	const pageContentBlocks = usePageContentBlocks( {
		blocks,
		isPageContentFocused: true,
	} );

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<HStack className="edit-site-summary-field">
			<Text className="edit-site-summary-field__label">
				{ __( 'Template' ) }
			</Text>
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
						{ !! pageContentBlocks?.length && (
							<MenuGroup>
								<MenuItem
									icon={
										! isTemplateHidden ? check : undefined
									}
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
		</HStack>
	);
}
