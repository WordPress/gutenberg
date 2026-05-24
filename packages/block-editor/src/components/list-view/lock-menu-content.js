import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import useBlockLock from '../block-lock/use-block-lock';

export default function LockMenuContent( { clientId } ) {
	const { isMoveLocked, isRemoveLocked, canLock } = useBlockLock( clientId );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { blockAttributes, hasLayoutLock, isPatternSection } = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );
			const { getBlockName, getBlockAttributes } = blockEditorSelect;
			const { isSectionBlock } = unlock( blockEditorSelect );
			const blockType = getBlockType( getBlockName( clientId ) );
			const attributes = getBlockAttributes( clientId );
			const _isPatternSection =
				!! attributes?.metadata?.patternName &&
				isSectionBlock( clientId );
			const _hasTemplateLock = !! blockType?.attributes?.templateLock;

			return {
				blockAttributes: attributes,
				hasLayoutLock: _hasTemplateLock || _isPatternSection,
				isPatternSection: _isPatternSection,
			};
		},
		[ clientId ]
	);
	const isLayoutLocked = blockAttributes?.templateLock === 'contentOnly';
	const isInnerBlocksLocked = isLayoutLocked || isPatternSection;

	if ( ! canLock ) {
		return null;
	}

	const applyLock = ( partial ) => {
		updateBlockAttributes( [ clientId ], {
			lock: { ...( blockAttributes?.lock ?? {} ), ...partial },
		} );
	};

	const toggleInnerBlocksLock = ( checked ) => {
		const nextAttributes = {
			templateLock: checked ? 'contentOnly' : undefined,
		};

		if ( checked ) {
			updateBlockAttributes( [ clientId ], nextAttributes );
			return;
		}

		if ( isPatternSection && blockAttributes?.metadata ) {
			const nextMetadata = { ...blockAttributes.metadata };
			delete nextMetadata.patternName;
			nextAttributes.metadata = Object.keys( nextMetadata ).length
				? nextMetadata
				: undefined;
		}

		updateBlockAttributes( [ clientId ], nextAttributes );
	};

	return (
		<>
			<Menu.CheckboxItem
				checked={ isMoveLocked }
				closeOnClick={ false }
				onCheckedChange={ ( checked ) =>
					applyLock( { move: checked } )
				}
			>
				<Menu.ItemLabel>{ __( 'Lock in place' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
			<Menu.CheckboxItem
				checked={ isRemoveLocked }
				closeOnClick={ false }
				onCheckedChange={ ( checked ) =>
					applyLock( { remove: checked } )
				}
			>
				<Menu.ItemLabel>{ __( 'Prevent deletion' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
			<Menu.CheckboxItem
				checked={ isInnerBlocksLocked }
				disabled={ ! hasLayoutLock }
				closeOnClick={ false }
				onCheckedChange={ ( checked ) =>
					toggleInnerBlocksLock( checked )
				}
			>
				<Menu.ItemLabel>{ __( 'Lock layout' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
		</>
	);
}
