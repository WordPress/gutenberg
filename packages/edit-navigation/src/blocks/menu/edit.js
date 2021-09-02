/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Placeholder from './placeholder';

const ALLOWED_BLOCKS = [ 'edit-navigation/menu-item' ];

function MenuEdit( {
	selectedBlockHasDescendants,
	clientId,
	hasExistingNavItems,
	isImmediateParentOfSelectedBlock,
	isSelected,
	updateInnerBlocks,
	className,
} ) {
	const [ isPlaceholderShown, setIsPlaceholderShown ] = useState(
		! hasExistingNavItems
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-menu__container',
		},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			renderAppender:
				( isImmediateParentOfSelectedBlock &&
					! selectedBlockHasDescendants ) ||
				isSelected
					? InnerBlocks.DefaultAppender
					: false,
			__experimentalCaptureToolbars: true,
			// Template lock set to false here so that the Nav
			// Block on the experimental menus screen does not
			// inherit templateLock={ 'all' }.
			templateLock: false,
		}
	);

	if ( isPlaceholderShown ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					onCreate={ ( blocks, selectNavigationBlock ) => {
						setIsPlaceholderShown( false );
						updateInnerBlocks( blocks );
						if ( selectNavigationBlock ) {
							selectBlock( clientId );
						}
					} }
				/>
			</div>
		);
	}

	return (
		<nav { ...blockProps }>
			<div { ...innerBlocksProps }></div>
		</nav>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( blockEditorStore ).getBlocks( clientId );
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( blockEditorStore );
		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;

		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants,
			hasExistingNavItems: !! innerBlocks.length,

			// This prop is already available but computing it here ensures it's
			// fresh compared to isImmediateParentOfSelectedBlock
			isSelected: selectedBlockId === clientId,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateInnerBlocks( blocks ) {
				if ( blocks?.length === 0 ) {
					return false;
				}
				dispatch( blockEditorStore ).replaceInnerBlocks(
					clientId,
					blocks,
					true
				);
			},
		};
	} ),
] )( MenuEdit );
