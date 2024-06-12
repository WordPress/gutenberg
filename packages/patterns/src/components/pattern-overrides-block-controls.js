/**
 * WordPress dependencies
 */
import { useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	DropdownMenu,
	ToolbarItem,
	__experimentalText as Text,
} from '@wordpress/components';
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { copy } from '@wordpress/icons';
import {
	store as blockEditorStore,
	BlockIcon,
	privateApis as blockEditorPrivateApis,
	BlockControls,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { PATTERN_OVERRIDES_BINDING_SOURCE } from '../constants';

const { useBlockDisplayTitle } = unlock( blockEditorPrivateApis );

function PatternOverridesToolbarIndicator( { clientIds } ) {
	const isSingleBlockSelected = clientIds.length === 1;
	const { icon, firstBlockName } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockNamesByClientId } =
				select( blockEditorStore );
			const { getBlockType, getActiveBlockVariation } =
				select( blocksStore );
			const blockTypeNames = getBlockNamesByClientId( clientIds );
			const _firstBlockTypeName = blockTypeNames[ 0 ];
			const firstBlockType = getBlockType( _firstBlockTypeName );
			let _icon;
			if ( isSingleBlockSelected ) {
				const match = getActiveBlockVariation(
					_firstBlockTypeName,
					getBlockAttributes( clientIds[ 0 ] )
				);
				// Take into account active block variations.
				_icon = match?.icon || firstBlockType.icon;
			} else {
				const isSelectionOfSameType =
					new Set( blockTypeNames ).size === 1;
				// When selection consists of blocks of multiple types, display an
				// appropriate icon to communicate the non-uniformity.
				_icon = isSelectionOfSameType ? firstBlockType.icon : copy;
			}

			return {
				icon: _icon,
				firstBlockName: getBlockAttributes( clientIds[ 0 ] ).metadata
					.name,
			};
		},
		[ clientIds, isSingleBlockSelected ]
	);
	const firstBlockTitle = useBlockDisplayTitle( {
		clientId: clientIds[ 0 ],
		maximumLength: 35,
	} );

	const blockDescription = isSingleBlockSelected
		? sprintf(
				/* translators: %1s: The block type's name; %2s: The block's user-provided name (the same as the override name). */
				__( 'This %1$s is editable using the "%2$s" override.' ),
				firstBlockTitle.toLowerCase(),
				firstBlockName
		  )
		: __( 'These blocks are editable using overrides.' );

	const descriptionId = useId();

	return (
		<ToolbarItem>
			{ ( toggleProps ) => (
				<DropdownMenu
					className="patterns-pattern-overrides-toolbar-indicator"
					label={ firstBlockTitle }
					popoverProps={ {
						placement: 'bottom-start',
						className:
							'patterns-pattern-overrides-toolbar-indicator__popover',
					} }
					icon={
						<>
							<BlockIcon
								icon={ icon }
								className="patterns-pattern-overrides-toolbar-indicator-icon"
								showColors
							/>
						</>
					}
					toggleProps={ {
						describedBy: blockDescription,
						...toggleProps,
					} }
					menuProps={ {
						orientation: 'both',
						'aria-describedby': descriptionId,
					} }
				>
					{ () => (
						<Text id={ descriptionId }>{ blockDescription }</Text>
					) }
				</DropdownMenu>
			) }
		</ToolbarItem>
	);
}

export default function PatternOverridesBlockControls() {
	const { clientIds, hasPatternOverrides, hasParentPattern } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getSelectedBlockClientIds,
				getBlockParentsByBlockName,
			} = select( blockEditorStore );
			const selectedClientIds = getSelectedBlockClientIds();
			const _hasPatternOverrides = selectedClientIds.every(
				( clientId ) =>
					Object.values(
						getBlockAttributes( clientId )?.metadata?.bindings ?? {}
					).some(
						( binding ) =>
							binding?.source === PATTERN_OVERRIDES_BINDING_SOURCE
					)
			);
			const _hasParentPattern = selectedClientIds.every(
				( clientId ) =>
					getBlockParentsByBlockName( clientId, 'core/block', true )
						.length > 0
			);
			return {
				clientIds: selectedClientIds,
				hasPatternOverrides: _hasPatternOverrides,
				hasParentPattern: _hasParentPattern,
			};
		},
		[]
	);

	return hasPatternOverrides && hasParentPattern ? (
		<BlockControls group="parent">
			<PatternOverridesToolbarIndicator clientIds={ clientIds } />
		</BlockControls>
	) : null;
}
