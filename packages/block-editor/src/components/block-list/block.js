/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useMemo,
	useCallback,
	RawHTML,
} from '@wordpress/element';
import {
	getBlockType,
	getSaveContent,
	isUnmodifiedDefaultBlock,
	serializeRawBlock,
	switchToBlockType,
	store as blocksStore,
	getDefaultBlockName,
	isUnmodifiedBlock,
} from '@wordpress/blocks';
import { withFilters } from '@wordpress/components';
import {
	withDispatch,
	withSelect,
	useDispatch,
	useSelect,
} from '@wordpress/data';
import { compose, pure, ifCondition } from '@wordpress/compose';
import { safeHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockHtml from './block-html';
import { useBlockProps } from './use-block-props';
import { store as blockEditorStore } from '../../store';
import { useLayout } from './layout';
export const BlockListBlockContext = createContext();

/**
 * Merges wrapper props with special handling for classNames and styles.
 *
 * @param {Object} propsA
 * @param {Object} propsB
 *
 * @return {Object} Merged props.
 */
function mergeWrapperProps( propsA, propsB ) {
	const newProps = {
		...propsA,
		...propsB,
	};

	if ( propsA?.className && propsB?.className ) {
		newProps.className = classnames( propsA.className, propsB.className );
	}
	if ( propsA?.style && propsB?.style ) {
		newProps.style = { ...propsA.style, ...propsB.style };
	}

	return newProps;
}

function Block( { children, isHtml, ...props } ) {
	return (
		<div { ...useBlockProps( props, { __unstableIsHtml: isHtml } ) }>
			{ children }
		</div>
	);
}

function BlockListBlock( {
	block: { __unstableBlockSource },
	mode,
	isLocked,
	canRemove,
	clientId,
	isSelected,
	isSelectionEnabled,
	className,
	__unstableLayoutClassNames: layoutClassNames,
	name,
	isValid,
	attributes,
	wrapperProps,
	setAttributes,
	onReplace,
	onInsertBlocksAfter,
	onMerge,
	toggleSelection,
} ) {
	const {
		themeSupportsLayout,
		hasContentLockedParent,
		isContentBlock,
		isContentLocking,
		isTemporarilyEditingAsBlocks,
	} = useSelect(
		( select ) => {
			const {
				getSettings,
				__unstableGetContentLockingParent,
				getTemplateLock,
				__unstableGetTemporarilyEditingAsBlocks,
			} = select( blockEditorStore );
			const _hasContentLockedParent =
				!! __unstableGetContentLockingParent( clientId );
			return {
				themeSupportsLayout: getSettings().supportsLayout,
				isContentBlock:
					select( blocksStore ).__experimentalHasContentRoleAttribute(
						name
					),
				hasContentLockedParent: _hasContentLockedParent,
				isContentLocking:
					getTemplateLock( clientId ) === 'contentOnly' &&
					! _hasContentLockedParent,
				isTemporarilyEditingAsBlocks:
					__unstableGetTemporarilyEditingAsBlocks() === clientId,
			};
		},
		[ name, clientId ]
	);
	const { removeBlock } = useDispatch( blockEditorStore );
	const onRemove = useCallback( () => removeBlock( clientId ), [ clientId ] );

	const parentLayout = useLayout() || {};

	// We wrap the BlockEdit component in a div that hides it when editing in
	// HTML mode. This allows us to render all of the ancillary pieces
	// (InspectorControls, etc.) which are inside `BlockEdit` but not
	// `BlockHTML`, even in HTML mode.
	let blockEdit = (
		<BlockEdit
			name={ name }
			isSelected={ isSelected }
			attributes={ attributes }
			setAttributes={ setAttributes }
			insertBlocksAfter={ isLocked ? undefined : onInsertBlocksAfter }
			onReplace={ canRemove ? onReplace : undefined }
			onRemove={ canRemove ? onRemove : undefined }
			mergeBlocks={ canRemove ? onMerge : undefined }
			clientId={ clientId }
			isSelectionEnabled={ isSelectionEnabled }
			toggleSelection={ toggleSelection }
			__unstableLayoutClassNames={ layoutClassNames }
			__unstableParentLayout={
				Object.keys( parentLayout ).length ? parentLayout : undefined
			}
		/>
	);

	const blockType = getBlockType( name );

	if ( hasContentLockedParent && ! isContentBlock ) {
		wrapperProps = {
			...wrapperProps,
			tabIndex: -1,
		};
	}
	// Determine whether the block has props to apply to the wrapper.
	if ( blockType?.getEditWrapperProps ) {
		wrapperProps = mergeWrapperProps(
			wrapperProps,
			blockType.getEditWrapperProps( attributes )
		);
	}

	const isAligned =
		wrapperProps &&
		!! wrapperProps[ 'data-align' ] &&
		! themeSupportsLayout;

	// For aligned blocks, provide a wrapper element so the block can be
	// positioned relative to the block column.
	// This is only kept for classic themes that don't support layout
	// Historically we used to rely on extra divs and data-align to
	// provide the alignments styles in the editor.
	// Due to the differences between frontend and backend, we migrated
	// to the layout feature, and we're now aligning the markup of frontend
	// and backend.
	if ( isAligned ) {
		blockEdit = (
			<div
				className="wp-block"
				data-align={ wrapperProps[ 'data-align' ] }
			>
				{ blockEdit }
			</div>
		);
	}

	let block;

	if ( ! isValid ) {
		const saveContent = __unstableBlockSource
			? serializeRawBlock( __unstableBlockSource )
			: getSaveContent( blockType, attributes );

		block = (
			<Block className="has-warning">
				<BlockInvalidWarning clientId={ clientId } />
				<RawHTML>{ safeHTML( saveContent ) }</RawHTML>
			</Block>
		);
	} else if ( mode === 'html' ) {
		// Render blockEdit so the inspector controls don't disappear.
		// See #8969.
		block = (
			<>
				<div style={ { display: 'none' } }>{ blockEdit }</div>
				<Block isHtml>
					<BlockHtml clientId={ clientId } />
				</Block>
			</>
		);
	} else if ( blockType?.apiVersion > 1 ) {
		block = blockEdit;
	} else {
		block = <Block { ...wrapperProps }>{ blockEdit }</Block>;
	}

	const { 'data-align': dataAlign, ...restWrapperProps } = wrapperProps ?? {};

	const value = {
		clientId,
		className: classnames(
			{
				'is-content-locked': isContentLocking,
				'is-content-locked-temporarily-editing-as-blocks':
					isTemporarilyEditingAsBlocks,
				'is-content-block': hasContentLockedParent && isContentBlock,
			},
			dataAlign && themeSupportsLayout && `align${ dataAlign }`,
			className
		),
		wrapperProps: restWrapperProps,
		isAligned,
	};

	const memoizedValue = useMemo( () => value, Object.values( value ) );

	return (
		<BlockListBlockContext.Provider value={ memoizedValue }>
			<BlockCrashBoundary
				fallback={
					<Block className="has-warning">
						<BlockCrashWarning />
					</Block>
				}
			>
				{ block }
			</BlockCrashBoundary>
		</BlockListBlockContext.Provider>
	);
}

const applyWithSelect = withSelect( ( select, { clientId, rootClientId } ) => {
	const {
		isBlockSelected,
		getBlockMode,
		isSelectionEnabled,
		getTemplateLock,
		__unstableGetBlockWithoutInnerBlocks,
		canRemoveBlock,
		canMoveBlock,
	} = select( blockEditorStore );
	const block = __unstableGetBlockWithoutInnerBlocks( clientId );
	const isSelected = isBlockSelected( clientId );
	const templateLock = getTemplateLock( rootClientId );
	const canRemove = canRemoveBlock( clientId, rootClientId );
	const canMove = canMoveBlock( clientId, rootClientId );

	// The fallback to `{}` is a temporary fix.
	// This function should never be called when a block is not present in
	// the state. It happens now because the order in withSelect rendering
	// is not correct.
	const { name, attributes, isValid } = block || {};

	// Do not add new properties here, use `useSelect` instead to avoid
	// leaking new props to the public API (editor.BlockListBlock filter).
	return {
		mode: getBlockMode( clientId ),
		isSelectionEnabled: isSelectionEnabled(),
		isLocked: !! templateLock,
		canRemove,
		canMove,
		// Users of the editor.BlockListBlock filter used to be able to
		// access the block prop.
		// Ideally these blocks would rely on the clientId prop only.
		// This is kept for backward compatibility reasons.
		block,
		name,
		attributes,
		isValid,
		isSelected,
	};
} );

const applyWithDispatch = withDispatch( ( dispatch, ownProps, registry ) => {
	const {
		updateBlockAttributes,
		insertBlocks,
		mergeBlocks,
		replaceBlocks,
		toggleSelection,
		__unstableMarkLastChangeAsPersistent,
		moveBlocksToPosition,
		removeBlock,
	} = dispatch( blockEditorStore );

	// Do not add new properties here, use `useDispatch` instead to avoid
	// leaking new props to the public API (editor.BlockListBlock filter).
	return {
		setAttributes( newAttributes ) {
			const { getMultiSelectedBlockClientIds } =
				registry.select( blockEditorStore );
			const multiSelectedBlockClientIds =
				getMultiSelectedBlockClientIds();
			const { clientId } = ownProps;
			const clientIds = multiSelectedBlockClientIds.length
				? multiSelectedBlockClientIds
				: [ clientId ];

			updateBlockAttributes( clientIds, newAttributes );
		},
		onInsertBlocks( blocks, index ) {
			const { rootClientId } = ownProps;
			insertBlocks( blocks, index, rootClientId );
		},
		onInsertBlocksAfter( blocks ) {
			const { clientId, rootClientId } = ownProps;
			const { getBlockIndex } = registry.select( blockEditorStore );
			const index = getBlockIndex( clientId );
			insertBlocks( blocks, index + 1, rootClientId );
		},
		onMerge( forward ) {
			const { clientId, rootClientId } = ownProps;
			const {
				getPreviousBlockClientId,
				getNextBlockClientId,
				getBlock,
				getBlockAttributes,
				getBlockName,
				getBlockOrder,
				getBlockIndex,
				getBlockRootClientId,
				canInsertBlockType,
			} = registry.select( blockEditorStore );

			/**
			 * Moves the block with clientId up one level. If the block type
			 * cannot be inserted at the new location, it will be attempted to
			 * convert to the default block type.
			 *
			 * @param {string}  _clientId       The block to move.
			 * @param {boolean} changeSelection Whether to change the selection
			 *                                  to the moved block.
			 */
			function moveFirstItemUp( _clientId, changeSelection = true ) {
				const targetRootClientId = getBlockRootClientId( _clientId );
				const blockOrder = getBlockOrder( _clientId );
				const [ firstClientId ] = blockOrder;

				if (
					blockOrder.length === 1 &&
					isUnmodifiedBlock( getBlock( firstClientId ) )
				) {
					removeBlock( _clientId );
				} else {
					if (
						canInsertBlockType(
							getBlockName( firstClientId ),
							targetRootClientId
						)
					) {
						moveBlocksToPosition(
							[ firstClientId ],
							_clientId,
							targetRootClientId,
							getBlockIndex( _clientId )
						);
					} else {
						const replacement = switchToBlockType(
							getBlock( firstClientId ),
							getDefaultBlockName()
						);

						if ( replacement && replacement.length ) {
							registry.batch( () => {
								insertBlocks(
									replacement,
									getBlockIndex( _clientId ),
									targetRootClientId,
									changeSelection
								);
								removeBlock( firstClientId, false );
							} );
						}
					}

					if (
						! getBlockOrder( _clientId ).length &&
						isUnmodifiedBlock( getBlock( _clientId ) )
					) {
						removeBlock( _clientId, false );
					}
				}
			}

			// For `Delete` or forward merge, we should do the exact same thing
			// as `Backspace`, but from the other block.
			if ( forward ) {
				if ( rootClientId ) {
					const nextRootClientId =
						getNextBlockClientId( rootClientId );

					if ( nextRootClientId ) {
						// If there is a block that follows with the same parent
						// block name and the same attributes, merge the inner
						// blocks.
						if (
							getBlockName( rootClientId ) ===
							getBlockName( nextRootClientId )
						) {
							const rootAttributes =
								getBlockAttributes( rootClientId );
							const previousRootAttributes =
								getBlockAttributes( nextRootClientId );

							if (
								Object.keys( rootAttributes ).every(
									( key ) =>
										rootAttributes[ key ] ===
										previousRootAttributes[ key ]
								)
							) {
								registry.batch( () => {
									moveBlocksToPosition(
										getBlockOrder( nextRootClientId ),
										nextRootClientId,
										rootClientId
									);
									removeBlock( nextRootClientId, false );
								} );
								return;
							}
						} else {
							mergeBlocks( rootClientId, nextRootClientId );
							return;
						}
					}
				}

				const nextBlockClientId = getNextBlockClientId( clientId );

				if ( ! nextBlockClientId ) {
					return;
				}

				if ( getBlockOrder( nextBlockClientId ).length ) {
					moveFirstItemUp( nextBlockClientId, false );
				} else {
					mergeBlocks( clientId, nextBlockClientId );
				}
			} else {
				const previousBlockClientId =
					getPreviousBlockClientId( clientId );

				if ( previousBlockClientId ) {
					mergeBlocks( previousBlockClientId, clientId );
				} else if ( rootClientId ) {
					const previousRootClientId =
						getPreviousBlockClientId( rootClientId );

					// If there is a preceding block with the same parent block
					// name and the same attributes, merge the inner blocks.
					if (
						previousRootClientId &&
						getBlockName( rootClientId ) ===
							getBlockName( previousRootClientId )
					) {
						const rootAttributes =
							getBlockAttributes( rootClientId );
						const previousRootAttributes =
							getBlockAttributes( previousRootClientId );

						if (
							Object.keys( rootAttributes ).every(
								( key ) =>
									rootAttributes[ key ] ===
									previousRootAttributes[ key ]
							)
						) {
							registry.batch( () => {
								moveBlocksToPosition(
									getBlockOrder( rootClientId ),
									rootClientId,
									previousRootClientId
								);
								removeBlock( rootClientId, false );
							} );
							return;
						}
					}

					moveFirstItemUp( rootClientId );
				}
			}
		},
		onReplace( blocks, indexToSelect, initialPosition ) {
			if (
				blocks.length &&
				! isUnmodifiedDefaultBlock( blocks[ blocks.length - 1 ] )
			) {
				__unstableMarkLastChangeAsPersistent();
			}
			replaceBlocks(
				[ ownProps.clientId ],
				blocks,
				indexToSelect,
				initialPosition
			);
		},
		toggleSelection( selectionEnabled ) {
			toggleSelection( selectionEnabled );
		},
	};
} );

export default compose(
	pure,
	applyWithSelect,
	applyWithDispatch,
	// Block is sometimes not mounted at the right time, causing it be undefined
	// see issue for more info
	// https://github.com/WordPress/gutenberg/issues/17013
	ifCondition( ( { block } ) => !! block ),
	withFilters( 'editor.BlockListBlock' )
)( BlockListBlock );
