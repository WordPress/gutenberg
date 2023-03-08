/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	BlockTools,
	__experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { useCallback, useState } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { NavigationMenuLoader } from './loader';

function renderAdditionalBlockUI( block, onClose ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { label, url, opensInNewTab } = block.attributes;
	const link = {
		url,
		opensInNewTab,
		title: label && stripHTML( label ),
	};
	return (
		<Popover placement="bottom" shift onClose={ onClose }>
			<LinkControl
				hasTextControl
				hasRichPreviews
				value={ link }
				onChange={ ( updatedValue ) => {
					updateBlockAttributes( block.clientId, {
						label: updatedValue.title,
						url: updatedValue.url,
						opensInNewTab: updatedValue.opensInNewTab,
					} );
					onClose();
				} }
				onCancel={ onClose }
			/>
		</Popover>
	);
}

export default function NavigationMenuContent( { rootClientId, onSelect } ) {
	const { clientIdsTree, isLoading } = useSelect(
		( select ) => {
			const { __unstableGetClientIdsTree, areInnerBlocksControlled } =
				select( blockEditorStore );
			return {
				clientIdsTree: __unstableGetClientIdsTree( rootClientId ),

				// This is a small hack to wait for the navigation block
				// to actually load its inner blocks.
				isLoading: ! areInnerBlocksControlled( rootClientId ),
			};
		},
		[ rootClientId ]
	);
	const { replaceBlock, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const [ customLinkEditPopoverOpenId, setIsCustomLinkEditPopoverOpenId ] =
		useState( false );

	const renderAdditionalBlockUICallback = useCallback(
		( block ) => {
			if (
				customLinkEditPopoverOpenId &&
				block.clientId === customLinkEditPopoverOpenId
			) {
				return renderAdditionalBlockUI( block, () => {
					setIsCustomLinkEditPopoverOpenId( false );
				} );
			}
		},
		[ customLinkEditPopoverOpenId, setIsCustomLinkEditPopoverOpenId ]
	);

	const { OffCanvasEditor, LeafMoreMenu } = unlock( blockEditorPrivateApis );

	const offCanvasOnselect = useCallback(
		( block ) => {
			if (
				block.name === 'core/navigation-link' &&
				! block.attributes.url
			) {
				__unstableMarkNextChangeAsNotPersistent();
				replaceBlock(
					block.clientId,
					createBlock( 'core/navigation-link', block.attributes )
				);
			} else if (
				block.name === 'core/navigation-link' &&
				block.attributes.kind === 'custom' &&
				block.attributes.url
			) {
				setIsCustomLinkEditPopoverOpenId( block.clientId );
			} else {
				onSelect( block );
			}
		},
		[
			onSelect,
			__unstableMarkNextChangeAsNotPersistent,
			replaceBlock,
			setIsCustomLinkEditPopoverOpenId,
		]
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ isLoading && <NavigationMenuLoader /> }
			{ ! isLoading && (
				<OffCanvasEditor
					blocks={ clientIdsTree }
					onSelect={ offCanvasOnselect }
					LeafMoreMenu={ LeafMoreMenu }
					showAppender={ false }
					renderAdditionalBlockUI={ renderAdditionalBlockUICallback }
				/>
			) }
			<div style={ { visibility: 'hidden' } }>
				<BlockTools>
					<BlockList />
				</BlockTools>
			</div>
		</>
	);
}
