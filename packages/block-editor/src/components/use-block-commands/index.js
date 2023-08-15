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
	edit as remove,
	create as add,
	group,
	ungroup,
	moveTo as move,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export const useTransformCommands = () => {
	const { clientIds } = useSelect( ( select ) => {
		const { getSelectedBlockClientIds } = select( blockEditorStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();

		return {
			clientIds: selectedBlockClientIds,
		};
	}, [] );
	const blocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocksByClientId( clientIds ),
		[ clientIds ]
	);
	const { replaceBlocks, multiSelect } = useDispatch( blockEditorStore );
	const { possibleBlockTransformations, canRemove } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockTransformItems,
				canRemoveBlocks,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId(
				Array.isArray( clientIds ) ? clientIds[ 0 ] : clientIds
			);
			return {
				possibleBlockTransformations: getBlockTransformItems(
					blocks,
					rootClientId
				),
				canRemove: canRemoveBlocks( clientIds, rootClientId ),
			};
		},
		[ clientIds, blocks ]
	);

	const isTemplate = blocks.length === 1 && isTemplatePart( blocks[ 0 ] );

	function selectForMultipleBlocks( insertedBlocks ) {
		if ( insertedBlocks.length > 1 ) {
			multiSelect(
				insertedBlocks[ 0 ].clientId,
				insertedBlocks[ insertedBlocks.length - 1 ].clientId
			);
		}
	}

	// Simple block tranformation based on the `Block Transforms` API.
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

	const commands = possibleBlockTransformations.map( ( transformation ) => {
		const { name, title, icon } = transformation;
		return {
			name: 'core/block-editor/transform-to-' + name.replace( '/', '-' ),
			// translators: %s: block title/name.
			label: sprintf( __( 'Transform to %s' ), title ),
			icon: icon.src,
			callback: ( { close } ) => {
				onBlockTransform( name );
				close();
			},
		};
	} );

	return { isLoading: false, commands };
};

const useActionsCommands = () => {
	const { clientIds } = useSelect( ( select ) => {
		const { getSelectedBlockClientIds } = select( blockEditorStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();

		return {
			clientIds: selectedBlockClientIds,
		};
	}, [] );
	const {
		canInsertBlockType,
		getBlockRootClientId,
		getBlocksByClientId,
		canMoveBlocks,
		canRemoveBlocks,
	} = useSelect( blockEditorStore );
	const { getDefaultBlockName, getGroupingBlockName } =
		useSelect( blocksStore );

	const blocks = getBlocksByClientId( clientIds );
	const rootClientId = getBlockRootClientId( clientIds[ 0 ] );

	const canDuplicate = blocks.every( ( block ) => {
		return (
			!! block &&
			hasBlockSupport( block.name, 'multiple', true ) &&
			canInsertBlockType( block.name, rootClientId )
		);
	} );

	const canInsertDefaultBlock = canInsertBlockType(
		getDefaultBlockName(),
		rootClientId
	);

	const canMove = canMoveBlocks( clientIds, rootClientId );
	const canRemove = canRemoveBlocks( clientIds, rootClientId );

	const {
		removeBlocks,
		replaceBlocks,
		duplicateBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		setBlockMovingClientId,
		setNavigationMode,
		selectBlock,
	} = useDispatch( blockEditorStore );

	const onDuplicate = () => {
		if ( ! canDuplicate ) {
			return;
		}
		return duplicateBlocks( clientIds, true );
	};
	const onRemove = () => {
		if ( ! canRemove ) {
			return;
		}
		return removeBlocks( clientIds, true );
	};
	const onAddBefore = () => {
		if ( ! canInsertDefaultBlock ) {
			return;
		}
		const clientId = Array.isArray( clientIds ) ? clientIds[ 0 ] : clientId;
		insertBeforeBlock( clientId );
	};
	const onAddAfter = () => {
		if ( ! canInsertDefaultBlock ) {
			return;
		}
		const clientId = Array.isArray( clientIds )
			? clientIds[ clientIds.length - 1 ]
			: clientId;
		insertAfterBlock( clientId );
	};
	const onMoveTo = () => {
		if ( ! canMove ) {
			return;
		}
		setNavigationMode( true );
		selectBlock( clientIds[ 0 ] );
		setBlockMovingClientId( clientIds[ 0 ] );
	};
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

	const icons = {
		ungroup,
		group,
		move,
		add,
		remove,
		duplicate: copy,
	};

	const commands = [
		onUngroup,
		onGroup,
		onMoveTo,
		onAddAfter,
		onAddBefore,
		onRemove,
		onDuplicate,
	].map( ( callback ) => {
		const action = callback.name
			.replace( 'on', '' )
			.replace( /([a-z])([A-Z])/g, '$1 $2' );

		return {
			name: 'core/block-editor/action-' + callback.name,
			// translators: %s: type of the command.
			label: action,
			icon: icons[
				callback.name
					.replace( 'on', '' )
					.match( /[A-Z]{1}[a-z]*/ )
					.toString()
					.toLowerCase()
			],
			callback: ( { close } ) => {
				callback();
				close();
			},
		};
	} );

	return { isLoading: false, commands };
};

export const useBlockCommands = () => {
	useCommandLoader( {
		name: 'core/block-editor/blockTransforms',
		hook: useTransformCommands,
	} );
	useCommandLoader( {
		name: 'core/block-editor/blockActions',
		hook: useActionsCommands,
	} );
};
