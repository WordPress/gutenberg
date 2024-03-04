/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	memo,
	useCallback,
	RawHTML,
	useContext,
	useMemo,
} from '@wordpress/element';
import {
	getBlockType,
	getSaveContent,
	serializeRawBlock,
	isReusableBlock,
	getBlockDefaultClassName,
	store as blocksStore,
} from '@wordpress/blocks';
import { withFilters } from '@wordpress/components';
import { withDispatch, useDispatch, useSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
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
import { PrivateBlockContext } from './private-block-context';

import { unlock } from '../../lock-unlock';

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

	// May be set to undefined, so check if the property is set!
	if (
		propsA?.hasOwnProperty( 'className' ) &&
		propsB?.hasOwnProperty( 'className' )
	) {
		newProps.className = classnames( propsA.className, propsB.className );
	}

	if (
		propsA?.hasOwnProperty( 'style' ) &&
		propsB?.hasOwnProperty( 'style' )
	) {
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
		mayDisplayControls,
		mayDisplayParentControls,
		themeSupportsLayout,
		...context
	} = useContext( PrivateBlockContext );
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
			mayDisplayControls={ mayDisplayControls }
			mayDisplayParentControls={ mayDisplayParentControls }
			blockEditingMode={ context.blockEditingMode }
		/>
	);

	const blockType = getBlockType( name );

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

	// Support for sticky position in classic themes with alignment wrappers.

	const isSticky = className?.includes( 'is-position-sticky' );

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
				className={ classnames( 'wp-block', isSticky && className ) }
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
		block = <Block>{ blockEdit }</Block>;
	}

	const { 'data-align': dataAlign, ...restWrapperProps } = wrapperProps ?? {};

	restWrapperProps.className = classnames(
		restWrapperProps.className,
		dataAlign && themeSupportsLayout && `align${ dataAlign }`,
		! ( dataAlign && isSticky ) && className
	);

	// We set a new context with the adjusted and filtered wrapperProps (through
	// `editor.BlockListBlock`), which the `BlockListBlockProvider` did not have
	// access to.
	return (
		<PrivateBlockContext.Provider
			value={ {
				wrapperProps: restWrapperProps,
				isAligned,
				...context,
			} }
		>
			<BlockCrashBoundary
				fallback={
					<Block className="has-warning">
						<BlockCrashWarning />
					</Block>
				}
			>
				{ block }
			</BlockCrashBoundary>
		</PrivateBlockContext.Provider>
	);
}

const applyWithDispatch = withDispatch( ( dispatch, ownProps ) => {
	const d = unlock( dispatch( blockEditorStore ) );
	const { clientId, rootClientId } = ownProps;

	// Do not add new properties here, use `useDispatch` instead to avoid
	// leaking new props to the public API (editor.BlockListBlock filter).
	return {
		setAttributes: ( newAttributes ) =>
			d.setAttributesEdit( clientId, newAttributes ),
		onInsertBlocks: ( blocks, index ) =>
			d.insertBlocks( blocks, index, rootClientId ),
		onInsertBlocksAfter: ( blocks ) =>
			d.insertBlocksAfterEdit( blocks, clientId, rootClientId ),
		onMerge: ( forward ) => d.mergeEdit( clientId, rootClientId, forward ),
		onReplace: ( blocks, indexToSelect, initialPos ) =>
			d.replaceEdit( clientId, blocks, indexToSelect, initialPos ),
		toggleSelection: ( selectionEnabled ) =>
			d.toggleSelection( selectionEnabled ),
	};
} );

// This component is used by the BlockListBlockProvider component below. It will
// add the props necessary for the `editor.BlockListBlock` filters.
BlockListBlock = compose(
	applyWithDispatch,
	withFilters( 'editor.BlockListBlock' )
)( BlockListBlock );

// This component provides all the information we need through a single store
// subscription (useSelect mapping). Only the necessary props are passed down
// to the BlockListBlock component, which is a filtered component, so these
// props are public API. To avoid adding to the public API, we use a private
// context to pass the rest of the information to the filtered BlockListBlock
// component, and useBlockProps.
function BlockListBlockProvider( props ) {
	const { clientId, rootClientId } = props;
	const selectedProps = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				getBlockMode,
				isSelectionEnabled,
				getTemplateLock,
				getBlockWithoutAttributes,
				getBlockAttributes,
				canRemoveBlock,
				canMoveBlock,

				getSettings,
				__unstableGetTemporarilyEditingAsBlocks,
				getBlockEditingMode,
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
				hasSelectedInnerBlock,

				getBlockIndex,
				isTyping,
				isBlockMultiSelected,
				isBlockSubtreeDisabled,
				isBlockHighlighted,
				__unstableIsFullySelected,
				__unstableSelectionHasUnmergeableBlock,
				isBlockBeingDragged,
				isDragging,
				hasBlockMovingClientId,
				canInsertBlockType,
				__unstableHasActiveBlockOverlayActive,
				__unstableGetEditorMode,
				getSelectedBlocksInitialCaretPosition,
			} = unlock( select( blockEditorStore ) );
			const blockWithoutAttributes =
				getBlockWithoutAttributes( clientId );

			// This is a temporary fix.
			// This function should never be called when a block is not
			// present in the state. It happens now because the order in
			// withSelect rendering is not correct.
			if ( ! blockWithoutAttributes ) {
				return;
			}

			const {
				hasBlockSupport: _hasBlockSupport,
				getActiveBlockVariation,
			} = select( blocksStore );
			const _isSelected = isBlockSelected( clientId );
			const canRemove = canRemoveBlock( clientId, rootClientId );
			const canMove = canMoveBlock( clientId, rootClientId );
			const attributes = getBlockAttributes( clientId );
			const { name: blockName, isValid } = blockWithoutAttributes;
			const blockType = getBlockType( blockName );
			const match = getActiveBlockVariation( blockName, attributes );
			const { outlineMode, supportsLayout } = getSettings();
			const isMultiSelected = isBlockMultiSelected( clientId );
			const checkDeep = true;
			const isAncestorOfSelectedBlock = hasSelectedInnerBlock(
				clientId,
				checkDeep
			);
			const typing = isTyping();
			const hasLightBlockWrapper = blockType?.apiVersion > 1;
			const movingClientId = hasBlockMovingClientId();
			const blockEditingMode = getBlockEditingMode( clientId );

			return {
				mode: getBlockMode( clientId ),
				isSelectionEnabled: isSelectionEnabled(),
				isLocked: !! getTemplateLock( rootClientId ),
				templateLock: getTemplateLock( clientId ),
				canRemove,
				canMove,
				blockWithoutAttributes,
				name: blockName,
				attributes,
				isValid,
				isSelected: _isSelected,
				themeSupportsLayout: supportsLayout,
				isTemporarilyEditingAsBlocks:
					__unstableGetTemporarilyEditingAsBlocks() === clientId,
				blockEditingMode,
				mayDisplayControls:
					_isSelected ||
					( isFirstMultiSelectedBlock( clientId ) &&
						getMultiSelectedBlockClientIds().every(
							( id ) => getBlockName( id ) === blockName
						) ),
				mayDisplayParentControls:
					_hasBlockSupport(
						getBlockName( clientId ),
						'__experimentalExposeControlsToChildren',
						false
					) && hasSelectedInnerBlock( clientId ),
				index: getBlockIndex( clientId ),
				blockApiVersion: blockType?.apiVersion || 1,
				blockTitle: match?.title || blockType?.title,
				isSubtreeDisabled:
					blockEditingMode === 'disabled' &&
					isBlockSubtreeDisabled( clientId ),
				isOutlineEnabled: outlineMode,
				hasOverlay:
					__unstableHasActiveBlockOverlayActive( clientId ) &&
					! isDragging(),
				initialPosition:
					_isSelected && __unstableGetEditorMode() === 'edit'
						? getSelectedBlocksInitialCaretPosition()
						: undefined,
				isHighlighted: isBlockHighlighted( clientId ),
				isMultiSelected,
				isPartiallySelected:
					isMultiSelected &&
					! __unstableIsFullySelected() &&
					! __unstableSelectionHasUnmergeableBlock(),
				isReusable: isReusableBlock( blockType ),
				isDragging: isBlockBeingDragged( clientId ),
				hasChildSelected: isAncestorOfSelectedBlock,
				removeOutline: _isSelected && outlineMode && typing,
				isBlockMovingMode: !! movingClientId,
				canInsertMovingBlock:
					movingClientId &&
					canInsertBlockType(
						getBlockName( movingClientId ),
						rootClientId
					),
				isEditingDisabled: blockEditingMode === 'disabled',
				hasEditableOutline:
					blockEditingMode !== 'disabled' &&
					getBlockEditingMode( rootClientId ) === 'disabled',
				className: hasLightBlockWrapper
					? attributes.className
					: undefined,
				defaultClassName: hasLightBlockWrapper
					? getBlockDefaultClassName( blockName )
					: undefined,
			};
		},
		[ clientId, rootClientId ]
	);

	const {
		mode,
		isSelectionEnabled,
		isLocked,
		canRemove,
		canMove,
		blockWithoutAttributes,
		name,
		attributes,
		isValid,
		isSelected,
		themeSupportsLayout,
		isTemporarilyEditingAsBlocks,
		blockEditingMode,
		mayDisplayControls,
		mayDisplayParentControls,
		index,
		blockApiVersion,
		blockTitle,
		isSubtreeDisabled,
		isOutlineEnabled,
		hasOverlay,
		initialPosition,
		isHighlighted,
		isMultiSelected,
		isPartiallySelected,
		isReusable,
		isDragging,
		hasChildSelected,
		removeOutline,
		isBlockMovingMode,
		canInsertMovingBlock,
		templateLock,
		isEditingDisabled,
		hasEditableOutline,
		className,
		defaultClassName,
	} = selectedProps;

	// Users of the editor.BlockListBlock filter used to be able to
	// access the block prop.
	// Ideally these blocks would rely on the clientId prop only.
	// This is kept for backward compatibility reasons.
	const block = useMemo(
		() => ( { ...blockWithoutAttributes, attributes } ),
		[ blockWithoutAttributes, attributes ]
	);

	// Block is sometimes not mounted at the right time, causing it be
	// undefined see issue for more info
	// https://github.com/WordPress/gutenberg/issues/17013
	if ( ! selectedProps ) {
		return null;
	}

	const privateContext = {
		clientId,
		className,
		index,
		mode,
		name,
		blockApiVersion,
		blockTitle,
		isSelected,
		isSubtreeDisabled,
		isOutlineEnabled,
		hasOverlay,
		initialPosition,
		blockEditingMode,
		isHighlighted,
		isMultiSelected,
		isPartiallySelected,
		isReusable,
		isDragging,
		hasChildSelected,
		removeOutline,
		isBlockMovingMode,
		canInsertMovingBlock,
		templateLock,
		isEditingDisabled,
		hasEditableOutline,
		isTemporarilyEditingAsBlocks,
		defaultClassName,
		mayDisplayControls,
		mayDisplayParentControls,
		themeSupportsLayout,
	};

	// Here we separate between the props passed to BlockListBlock and any other
	// information we selected for internal use. BlockListBlock is a filtered
	// component and thus ALL the props are PUBLIC API.

	// Note that the context value doesn't have to be memoized in this case
	// because when it changes, this component will be re-rendered anyway, and
	// none of the consumers (BlockListBlock and useBlockProps) are memoized or
	// "pure". This is different from the public BlockEditContext, where
	// consumers might be memoized or "pure".
	return (
		<PrivateBlockContext.Provider value={ privateContext }>
			<BlockListBlock
				{ ...props }
				// WARNING: all the following props are public API (through the
				// editor.BlockListBlock filter) and normally nothing new should
				// be added to it.
				{ ...{
					mode,
					isSelectionEnabled,
					isLocked,
					canRemove,
					canMove,
					// Users of the editor.BlockListBlock filter used to be able
					// to access the block prop. Ideally these blocks would rely
					// on the clientId prop only. This is kept for backward
					// compatibility reasons.
					block,
					name,
					attributes,
					isValid,
					isSelected,
				} }
			/>
		</PrivateBlockContext.Provider>
	);
}

export default memo( BlockListBlockProvider );
