/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef, useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';
import { useShowMoversGestures } from '../block-toolbar/utils';
import { BlockSettingsDropdownContext } from './block-settings-dropdown';

export function SelectParentMenuItem() {
	const { shortcuts, blockClientIds, selectedBlockClientIds } = useContext(
		BlockSettingsDropdownContext
	);

	const firstBlockClientId = blockClientIds[ 0 ];

	const { selectBlock, toggleBlockHighlight } =
		useDispatch( blockEditorStore );

	const { isDistractionFree, firstParentClientId, parentBlockType } =
		useSelect(
			( select ) => {
				const {
					getSettings,
					getBlockAttributes,
					getBlockRootClientId,
					getBlockName,
				} = select( blockEditorStore );

				const { getActiveBlockVariation } = select( blocksStore );

				const _firstParentClientId =
					getBlockRootClientId( firstBlockClientId );
				const parentBlockName =
					_firstParentClientId &&
					getBlockName( _firstParentClientId );

				return {
					isDistractionFree: getSettings().isDistractionFree,
					firstParentClientId: _firstParentClientId,
					parentBlockType:
						_firstParentClientId &&
						( getActiveBlockVariation(
							parentBlockName,
							getBlockAttributes( _firstParentClientId )
						) ||
							getBlockType( parentBlockName ) ),
				};
			},
			[ firstBlockClientId ]
		);

	// Allows highlighting the parent block outline when focusing or hovering
	// the parent block selector within the child.
	const selectParentButtonRef = useRef();
	const { gestures: showParentOutlineGestures } = useShowMoversGestures( {
		ref: selectParentButtonRef,
		onChange( isFocused ) {
			if ( isFocused && isDistractionFree ) {
				return;
			}
			toggleBlockHighlight( firstParentClientId, isFocused );
		},
	} );

	// This can occur when the selected block (the parent)
	// displays child blocks within a List View.
	const parentBlockIsSelected =
		selectedBlockClientIds?.includes( firstParentClientId );

	if ( ! firstParentClientId || parentBlockIsSelected ) {
		return null;
	}

	return (
		<MenuItem
			ref={ selectParentButtonRef }
			icon={ <BlockIcon icon={ parentBlockType.icon } /> }
			onClick={ () => {
				selectBlock( firstParentClientId );
			} }
			shortcut={ shortcuts.selectParent }
			{ ...showParentOutlineGestures }
		>
			{ sprintf(
				/* translators: %s: Name of the block's parent. */
				__( 'Select parent block (%s)' ),
				parentBlockType.title
			) }
		</MenuItem>
	);
}
