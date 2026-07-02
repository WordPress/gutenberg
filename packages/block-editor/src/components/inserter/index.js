/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	createBlock,
	store as blocksStore,
	__experimentalGetBlockLabel as getBlockLabel,
} from '@wordpress/blocks';
import { forwardRef } from '@wordpress/element';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import QuickInserter from './quick-inserter';
import { store as blockEditorStore } from '../../store';
import { getAppenderLabel } from './get-appender-label';

const UnforwardedInserterToggle = (
	{
		onToggle,
		disabled,
		isOpen,
		blockTitle,
		hasSingleBlockType,
		appenderLabel,
		toggleProps = {},
	},
	ref
) => {
	const {
		as: Wrapper = Button,
		label: labelProp,
		onClick,
		...rest
	} = toggleProps;

	let label = labelProp;
	if ( ! label && appenderLabel ) {
		// Block returns the full label; use directly (consistent with getBlockLabel).
		label = appenderLabel;
	} else if ( ! label && hasSingleBlockType ) {
		label = sprintf(
			// translators: %s: the name of the block when there is only one
			_x( 'Add %s', 'directly add the only allowed block' ),
			blockTitle.toLowerCase()
		);
	} else if ( ! label ) {
		label = _x( 'Add block', 'Generic label for block inserter button' );
	}

	// Handle both onClick functions from the toggle and the parent component.
	function handleClick( event ) {
		if ( onToggle ) {
			onToggle( event );
		}
		if ( onClick ) {
			onClick( event );
		}
	}

	return (
		<Wrapper
			ref={ ref }
			__next40pxDefaultSize={ toggleProps.as ? undefined : true }
			icon={ plus }
			label={ label }
			tooltipPosition="bottom"
			onClick={ handleClick }
			className="block-editor-inserter__toggle"
			aria-haspopup={ ! hasSingleBlockType ? 'true' : false }
			aria-expanded={ ! hasSingleBlockType ? isOpen : false }
			isPressed={ ! hasSingleBlockType && isOpen }
			disabled={ disabled }
			{ ...rest }
		/>
	);
};

const InserterToggle = forwardRef( UnforwardedInserterToggle );

const UnforwardedInserter = (
	{
		clientId,
		rootClientId,
		disabled,
		isAppender,
		position,
		selectBlockOnInsert,
		shouldDirectInsert = true,
		showInserterHelpPanel,
		// This prop is experimental to give some time for the quick inserter to mature
		// Feel free to make them stable after a few releases.
		__experimentalIsQuick: isQuick,
		onSelectOrClose,
		onToggle,
		renderToggle: renderToggleProp,
		toggleProps,
	},
	ref
) => {
	const {
		hasItems,
		hasSingleBlockType,
		blockTitle,
		allowedBlockType,
		blockToInsert,
		appenderLabel,
		targetRootClientId,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				hasInserterItems,
				getAllowedBlocks,
				getDirectInsertBlock,
				getBlockListSettings,
			} = select( blockEditorStore );
			const { getBlockVariations, getBlockType } = select( blocksStore );

			const _targetRootClientId =
				rootClientId || getBlockRootClientId( clientId ) || undefined;

			const allowedBlocks = getAllowedBlocks( _targetRootClientId );
			const directInsertBlock =
				shouldDirectInsert &&
				getDirectInsertBlock( _targetRootClientId );
			const { defaultBlock } =
				getBlockListSettings( _targetRootClientId ) ?? {};

			const _hasSingleBlockType =
				allowedBlocks?.length === 1 &&
				getBlockVariations( allowedBlocks[ 0 ].name, 'inserter' )
					?.length === 0;
			const _allowedBlockType = _hasSingleBlockType
				? allowedBlocks[ 0 ]
				: null;

			// Single-block-type parents get adjacent-attribute copying
			// without needing to set `directInsert: true`.
			let _blockToInsert = directInsertBlock || null;
			if (
				! _blockToInsert &&
				_hasSingleBlockType &&
				defaultBlock?.name === _allowedBlockType.name
			) {
				_blockToInsert = defaultBlock;
			}

			const defaultBlockType = directInsertBlock
				? getBlockType( directInsertBlock.name )
				: null;
			return {
				hasItems: hasInserterItems( _targetRootClientId ),
				hasSingleBlockType: _hasSingleBlockType,
				blockTitle: _allowedBlockType ? _allowedBlockType.title : '',
				allowedBlockType: _allowedBlockType,
				blockToInsert: _blockToInsert,
				appenderLabel: getAppenderLabel(
					directInsertBlock,
					defaultBlockType
				),
				targetRootClientId: _targetRootClientId,
			};
		},
		[ rootClientId, clientId, shouldDirectInsert ]
	);

	const { insertBlock } = useDispatch( blockEditorStore );
	const {
		getBlock,
		getBlockIndex,
		getBlockOrder,
		getBlockRootClientId,
		getBlockSelectionEnd,
		getPreviousBlockClientId,
	} = useSelect( blockEditorStore );
	const { getActiveBlockVariation, getBlockType } = useSelect( blocksStore );

	// The global inserter (no isAppender, no rootClientId, no clientId) should
	// always render, even with no items.
	if ( ! hasItems && ( isAppender || targetRootClientId || clientId ) ) {
		return null;
	}

	function insertOnlyAllowedBlock() {
		const blockName = blockToInsert?.name ?? allowedBlockType.name;

		function getAdjacentBlockAttributes( attributesToCopy ) {
			if ( ! attributesToCopy?.length ) {
				return {};
			}

			// Find the adjacent block of the same type whose attributes
			// should be copied: previous sibling when inserting next to
			// an existing block, otherwise the last child of the root.
			let adjacentAttributes;
			if ( clientId ) {
				const currentBlock = getBlock( clientId );
				const previousBlock = getBlock(
					getPreviousBlockClientId( clientId )
				);
				if ( currentBlock?.name === previousBlock?.name ) {
					adjacentAttributes = previousBlock?.attributes;
				}
			} else if ( targetRootClientId ) {
				const lastInnerBlock =
					getBlock( targetRootClientId )?.innerBlocks?.at( -1 );
				if ( lastInnerBlock?.name === blockName ) {
					adjacentAttributes = lastInnerBlock.attributes;
				}
			}

			if ( ! adjacentAttributes ) {
				return {};
			}

			return Object.fromEntries(
				attributesToCopy
					.filter( ( attr ) => attr in adjacentAttributes )
					.map( ( attr ) => [ attr, adjacentAttributes[ attr ] ] )
			);
		}

		function getInsertionIndex() {
			// If the clientId is defined, we insert at the position of the block.
			if ( clientId ) {
				return getBlockIndex( clientId );
			}

			// If there a selected block, we insert after the selected block.
			const end = getBlockSelectionEnd();
			if (
				! isAppender &&
				end &&
				getBlockRootClientId( end ) === targetRootClientId
			) {
				return getBlockIndex( end ) + 1;
			}

			// Otherwise, we insert at the end of the current rootClientId.
			return getBlockOrder( targetRootClientId ).length;
		}

		// Attempt to augment the inserted block with attributes from an adjacent block.
		// This ensures styling from nearby blocks is preserved in the newly inserted block.
		// See: https://github.com/WordPress/gutenberg/issues/37904
		const newAttributes = getAdjacentBlockAttributes(
			blockToInsert?.attributesToCopy
		);

		const newBlock = createBlock( blockName, {
			...blockToInsert?.attributes,
			...newAttributes,
		} );

		insertBlock(
			newBlock,
			getInsertionIndex(),
			targetRootClientId,
			selectBlockOnInsert
		);

		onSelectOrClose?.( newBlock );

		const blockTypeToInsert = getBlockType( blockName );
		let blockLabelToInsert;
		if ( blockTypeToInsert ) {
			blockLabelToInsert = getBlockLabel(
				blockTypeToInsert,
				newBlock.attributes
			);

			if ( blockLabelToInsert === blockTypeToInsert.title ) {
				blockLabelToInsert =
					getActiveBlockVariation( blockName, newBlock.attributes )
						?.title || blockLabelToInsert;
			}
		}

		if ( blockLabelToInsert ) {
			const message = sprintf(
				// translators: %s: the name of the block that has been added
				__( '%s block added' ),
				blockLabelToInsert
			);
			speak( message );
		}
	}

	function renderToggle( { onToggle: dropdownOnToggle, isOpen } ) {
		const toggleArgs = {
			onToggle: dropdownOnToggle,
			isOpen,
			disabled: disabled || ! hasItems,
			blockTitle,
			hasSingleBlockType,
			appenderLabel,
			toggleProps,
		};

		if ( renderToggleProp ) {
			return renderToggleProp( toggleArgs );
		}

		return <InserterToggle ref={ ref } { ...toggleArgs } />;
	}

	function renderContent( { onClose } ) {
		if ( isQuick ) {
			return (
				<QuickInserter
					onSelect={ ( blocks ) => {
						const firstBlock =
							Array.isArray( blocks ) && blocks?.length
								? blocks[ 0 ]
								: blocks;
						if (
							onSelectOrClose &&
							typeof onSelectOrClose === 'function'
						) {
							onSelectOrClose( firstBlock );
						}
						onClose();
					} }
					rootClientId={ targetRootClientId }
					clientId={ clientId }
					isAppender={ isAppender }
					selectBlockOnInsert={ selectBlockOnInsert }
				/>
			);
		}

		return (
			<InserterMenu
				onSelect={ () => {
					onClose();
				} }
				onClose={ onClose }
				rootClientId={ targetRootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				showInserterHelpPanel={ showInserterHelpPanel }
			/>
		);
	}

	if ( hasSingleBlockType || blockToInsert ) {
		return renderToggle( { onToggle: insertOnlyAllowedBlock } );
	}

	return (
		<Dropdown
			className="block-editor-inserter"
			contentClassName={ clsx( 'block-editor-inserter__popover', {
				'is-quick': isQuick,
			} ) }
			popoverProps={ { position, shift: true } }
			onToggle={ onToggle }
			expandOnMobile
			headerTitle={ __( 'Add a block' ) }
			renderToggle={ renderToggle }
			renderContent={ renderContent }
			onClose={ onSelectOrClose }
		/>
	);
};

const Inserter = forwardRef( UnforwardedInserter );

export default Inserter;
