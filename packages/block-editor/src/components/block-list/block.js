/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, omit } from 'lodash';

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
} from '@wordpress/blocks';
import { withFilters } from '@wordpress/components';
import { withDispatch, withSelect, useDispatch } from '@wordpress/data';
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

	if ( propsA && propsB && propsA.className && propsB.className ) {
		newProps.className = classnames( propsA.className, propsB.className );
	}
	if ( propsA && propsB && propsA.style && propsB.style ) {
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
	mode,
	isLocked,
	canRemove,
	clientId,
	isSelected,
	isSelectionEnabled,
	className,
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
	const { removeBlock } = useDispatch( blockEditorStore );
	const onRemove = useCallback( () => removeBlock( clientId ), [ clientId ] );

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
			insertBlocksAfter={ isLocked ? noop : onInsertBlocksAfter }
			onReplace={ canRemove ? onReplace : noop }
			onRemove={ canRemove ? onRemove : noop }
			mergeBlocks={ canRemove ? onMerge : noop }
			clientId={ clientId }
			isSelectionEnabled={ isSelectionEnabled }
			toggleSelection={ toggleSelection }
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

	const isAligned = wrapperProps && !! wrapperProps[ 'data-align' ];

	// For aligned blocks, provide a wrapper element so the block can be
	// positioned relative to the block column.
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
		const saveContent = getSaveContent( blockType, attributes );

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

	const value = {
		clientId,
		className,
		wrapperProps: omit( wrapperProps, [ 'data-align' ] ),
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

const applyWithDispatch = withDispatch( ( dispatch, ownProps, { select } ) => {
	const {
		updateBlockAttributes,
		insertBlocks,
		mergeBlocks,
		replaceBlocks,
		toggleSelection,
		__unstableMarkLastChangeAsPersistent,
	} = dispatch( blockEditorStore );

	// Do not add new properties here, use `useDispatch` instead to avoid
	// leaking new props to the public API (editor.BlockListBlock filter).
	return {
		setAttributes( newAttributes ) {
			const { getMultiSelectedBlockClientIds } = select(
				blockEditorStore
			);
			const multiSelectedBlockClientIds = getMultiSelectedBlockClientIds();
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
			const { getBlockIndex } = select( blockEditorStore );
			const index = getBlockIndex( clientId );
			insertBlocks( blocks, index + 1, rootClientId );
		},
		onMerge( forward ) {
			const { clientId } = ownProps;
			const { getPreviousBlockClientId, getNextBlockClientId } = select(
				blockEditorStore
			);

			if ( forward ) {
				const nextBlockClientId = getNextBlockClientId( clientId );
				if ( nextBlockClientId ) {
					mergeBlocks( clientId, nextBlockClientId );
				}
			} else {
				const previousBlockClientId = getPreviousBlockClientId(
					clientId
				);
				if ( previousBlockClientId ) {
					mergeBlocks( previousBlockClientId, clientId );
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
	// block is sometimes not mounted at the right time, causing it be undefined
	// see issue for more info
	// https://github.com/WordPress/gutenberg/issues/17013
	ifCondition( ( { block } ) => !! block ),
	withFilters( 'editor.BlockListBlock' )
)( BlockListBlock );
