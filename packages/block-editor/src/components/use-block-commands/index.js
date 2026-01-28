/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	hasBlockSupport,
	store as blocksStore,
	switchToBlockType,
	isTemplatePart,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCommandLoader } from '@wordpress/commands';
import {
	copy,
	trash as remove,
	plus as add,
	group,
	ungroup,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';

const getTransformCommands = () =>
	function useTransformCommands() {
		const { replaceBlocks, multiSelect } = useDispatch( blockEditorStore );
		const {
			blocks,
			clientIds,
			canRemove,
			possibleBlockTransformations,
			invalidSelection,
		} = useSelect( ( select ) => {
			const {
				getBlockRootClientId,
				getBlockTransformItems,
				getSelectedBlockClientIds,
				getBlocksByClientId,
				canRemoveBlocks,
			} = select( blockEditorStore );

			const selectedBlockClientIds = getSelectedBlockClientIds();
			const selectedBlocks = getBlocksByClientId(
				selectedBlockClientIds
			);

			// selectedBlocks can have `null`s when something tries to call `selectBlock` with an inexistent clientId.
			// These nulls will cause fatal errors down the line.
			// In order to prevent discrepancies between selectedBlockClientIds and selectedBlocks, we effectively treat the entire selection as invalid.
			// @see https://github.com/WordPress/gutenberg/pull/59410#issuecomment-2006304536
			if ( selectedBlocks.filter( ( block ) => ! block ).length > 0 ) {
				return {
					invalidSelection: true,
				};
			}

			const rootClientId = getBlockRootClientId(
				selectedBlockClientIds[ 0 ]
			);
			return {
				blocks: selectedBlocks,
				clientIds: selectedBlockClientIds,
				possibleBlockTransformations: getBlockTransformItems(
					selectedBlocks,
					rootClientId
				),
				canRemove: canRemoveBlocks( selectedBlockClientIds ),
				invalidSelection: false,
			};
		}, [] );

		if ( invalidSelection ) {
			return {
				isLoading: false,
				commands: [],
			};
		}
		const isTemplate = blocks.length === 1 && isTemplatePart( blocks[ 0 ] );

		function selectForMultipleBlocks( insertedBlocks ) {
			if ( insertedBlocks.length > 1 ) {
				multiSelect(
					insertedBlocks[ 0 ].clientId,
					insertedBlocks[ insertedBlocks.length - 1 ].clientId
				);
			}
		}

		// Simple block transformation based on the `Block Transforms` API.
		function onBlockTransform( name ) {
			const newBlocks = switchToBlockType( blocks, name );
			replaceBlocks( clientIds, newBlocks );
			selectForMultipleBlocks( newBlocks );
		}

		/**
		 * The `isTemplate` check is a stopgap solution here.
		 * Ideally, the Transforms API should handle this
		 * by allowing to exclude blocks from wildcard transformations.
		 */
		const hasPossibleBlockTransformations =
			!! possibleBlockTransformations.length && canRemove && ! isTemplate;

		if (
			! clientIds ||
			clientIds.length < 1 ||
			! hasPossibleBlockTransformations
		) {
			return { isLoading: false, commands: [] };
		}

		const commands = possibleBlockTransformations.map(
			( transformation ) => {
				const { name, title, icon } = transformation;
				return {
					name:
						'core/block-editor/transform-to-' +
						name.replace( '/', '-' ),
					/* translators: %s: Block or block variation name. */
					label: sprintf( __( 'Transform to %s' ), title ),
					icon: <BlockIcon icon={ icon } />,
					callback: ( { close } ) => {
						onBlockTransform( name );
						close();
					},
				};
			}
		);

		return { isLoading: false, commands };
	};

const getQuickActionsCommands = () =>
	function useQuickActionsCommands() {
		const { clientIds, isUngroupable, isGroupable } = useSelect(
			( select ) => {
				const {
					getSelectedBlockClientIds,
					isUngroupable: _isUngroupable,
					isGroupable: _isGroupable,
				} = select( blockEditorStore );
				const selectedBlockClientIds = getSelectedBlockClientIds();

				return {
					clientIds: selectedBlockClientIds,
					isUngroupable: _isUngroupable(),
					isGroupable: _isGroupable(),
				};
			},
			[]
		);
		const {
			canInsertBlockType,
			getBlockRootClientId,
			getBlocksByClientId,
			canRemoveBlocks,
		} = useSelect( blockEditorStore );
		const { getDefaultBlockName, getGroupingBlockName } =
			useSelect( blocksStore );

		const blocks = getBlocksByClientId( clientIds );

		const {
			removeBlocks,
			replaceBlocks,
			duplicateBlocks,
			insertAfterBlock,
			insertBeforeBlock,
		} = useDispatch( blockEditorStore );

		const onGroup = () => {
			if ( ! blocks.length ) {
				return;
			}

			const groupingBlockName = getGroupingBlockName();

			// Activate the `transform` on `core/group` which does the conversion.
			const newBlocks = switchToBlockType( blocks, groupingBlockName );

			if ( ! newBlocks ) {
				return;
			}
			replaceBlocks( clientIds, newBlocks );
		};
		const onUngroup = () => {
			if ( ! blocks.length ) {
				return;
			}

			const innerBlocks = blocks[ 0 ].innerBlocks;

			if ( ! innerBlocks.length ) {
				return;
			}

			replaceBlocks( clientIds, innerBlocks );
		};

		if ( ! clientIds || clientIds.length < 1 ) {
			return { isLoading: false, commands: [] };
		}

		const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
		const canInsertDefaultBlock = canInsertBlockType(
			getDefaultBlockName(),
			rootClientId
		);
		const canDuplicate = blocks.every( ( block ) => {
			return (
				!! block &&
				hasBlockSupport( block.name, 'multiple', true ) &&
				canInsertBlockType( block.name, rootClientId )
			);
		} );
		const canRemove = canRemoveBlocks( clientIds );

		const commands = [];

		if ( canDuplicate ) {
			commands.push( {
				name: 'duplicate',
				label: __( 'Duplicate' ),
				callback: () => duplicateBlocks( clientIds, true ),
				icon: copy,
			} );
		}

		if ( canInsertDefaultBlock ) {
			commands.push(
				{
					name: 'add-before',
					label: __( 'Add before' ),
					callback: () => {
						const clientId = Array.isArray( clientIds )
							? clientIds[ 0 ]
							: clientId;
						insertBeforeBlock( clientId );
					},
					icon: add,
				},
				{
					name: 'add-after',
					label: __( 'Add after' ),
					callback: () => {
						const clientId = Array.isArray( clientIds )
							? clientIds[ clientIds.length - 1 ]
							: clientId;
						insertAfterBlock( clientId );
					},
					icon: add,
				}
			);
		}

		if ( isGroupable ) {
			commands.push( {
				name: 'Group',
				label: __( 'Group' ),
				callback: onGroup,
				icon: group,
			} );
		}

		if ( isUngroupable ) {
			commands.push( {
				name: 'ungroup',
				label: __( 'Ungroup' ),
				callback: onUngroup,
				icon: ungroup,
			} );
		}

		if ( canRemove ) {
			commands.push( {
				name: 'remove',
				label: __( 'Delete' ),
				callback: () => removeBlocks( clientIds, true ),
				icon: remove,
			} );
		}

		return {
			isLoading: false,
			commands: commands.map( ( command ) => ( {
				...command,
				name: 'core/block-editor/action-' + command.name,
				callback: ( { close } ) => {
					command.callback();
					close();
				},
			} ) ),
		};
	};

export const useBlockCommands = () => {
	useCommandLoader( {
		name: 'core/block-editor/blockTransforms',
		hook: getTransformCommands(),
	} );
	useCommandLoader( {
		name: 'core/block-editor/blockQuickActions',
		hook: getQuickActionsCommands(),
		context: 'block-selection-edit',
	} );
};
