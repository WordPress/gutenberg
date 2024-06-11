/**
 * WordPress dependencies
 */
import { useId } from '@wordpress/element';
import { __, sprintf, _x } from '@wordpress/i18n';
import {
	DropdownMenu,
	ToolbarGroup,
	ToolbarItem,
	__experimentalText as Text,
} from '@wordpress/components';
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { copy } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

export default function BlockBindingsToolbarIndicator( { clientIds } ) {
	const isSingleBlockSelected = clientIds.length === 1;
	const { icon, firstBlockName, isConnectedToPatternOverrides } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockNamesByClientId,
				getBlocksByClientId,
			} = select( blockEditorStore );
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
				isConnectedToPatternOverrides: getBlocksByClientId(
					clientIds
				).some( ( block ) =>
					Object.values(
						block?.attributes?.metadata?.bindings || {}
					).some(
						( binding ) =>
							binding.source === 'core/pattern-overrides'
					)
				),
			};
		},
		[ clientIds, isSingleBlockSelected ]
	);
	const firstBlockTitle = useBlockDisplayTitle( {
		clientId: clientIds[ 0 ],
		maximumLength: 35,
	} );

	let blockDescription = isSingleBlockSelected
		? _x(
				'This block is connected.',
				'block toolbar button label and description'
		  )
		: _x(
				'These blocks are connected.',
				'block toolbar button label and description'
		  );
	if ( isConnectedToPatternOverrides && firstBlockName ) {
		blockDescription = isSingleBlockSelected
			? sprintf(
					/* translators: %1s: The block type's name; %2s: The block's user-provided name (the same as the override name). */
					__( 'This %1$s is editable using the "%2$s" override.' ),
					firstBlockTitle.toLowerCase(),
					firstBlockName
			  )
			: __( 'These blocks are editable using overrides.' );
	}
	const descriptionId = useId();

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="block-editor-block-bindings-toolbar-indicator"
						label={ firstBlockTitle }
						popoverProps={ {
							placement: 'bottom-start',
							className:
								'block-editor-block-bindings-toolbar-indicator__popover',
						} }
						icon={
							<>
								<BlockIcon
									icon={ icon }
									className="block-editor-block-bindings-toolbar-indicator-icon"
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
							<Text id={ descriptionId }>
								{ blockDescription }
							</Text>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
