/**
 * External dependencies
 */
import { mapValues, pick, isEqual } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withViewportMatch } from '@wordpress/viewport';
import { Component, forwardRef, useRef } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	getBlockType,
	synchronizeBlocksWithTemplate,
	withBlockContentContext,
} from '@wordpress/blocks';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ButtonBlockAppender from './button-block-appender';
import DefaultBlockAppender from './default-block-appender';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import { BlockContextProvider } from '../block-context';
import { withBlockEditContext } from '../block-edit/context';

/**
 * Block context cache, implemented as a WeakMap mapping block types to a
 * WeakMap mapping attributes object to context value.
 *
 * @type {WeakMap<string,WeakMap<string,*>>}
 */
const BLOCK_CONTEXT_CACHE = new WeakMap();

/**
 * Returns a cached context object value for a given set of attributes for the
 * block type.
 *
 * @param {Record<string,*>} attributes Block attributes object.
 * @param {WPBlockType}      blockType  Block type settings.
 *
 * @return {Record<string,*>} Context value.
 */
function getBlockContext( attributes, blockType ) {
	if ( ! BLOCK_CONTEXT_CACHE.has( blockType ) ) {
		BLOCK_CONTEXT_CACHE.set( blockType, new WeakMap() );
	}

	const blockTypeCache = BLOCK_CONTEXT_CACHE.get( blockType );
	if ( ! blockTypeCache.has( attributes ) ) {
		const context = mapValues(
			blockType.providesContext,
			( attributeName ) => attributes[ attributeName ]
		);

		blockTypeCache.set( attributes, context );
	}

	return blockTypeCache.get( attributes );
}

class InnerBlocks extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			templateInProcess: !! this.props.template,
		};
		this.updateNestedSettings();
	}

	componentDidMount() {
		const {
			block,
			templateLock,
			__experimentalBlocks,
			replaceInnerBlocks,
			__unstableMarkNextChangeAsNotPersistent,
		} = this.props;
		const { innerBlocks } = block;
		// Only synchronize innerBlocks with template if innerBlocks are empty or a locking all exists directly on the block.
		if ( innerBlocks.length === 0 || templateLock === 'all' ) {
			this.synchronizeBlocksWithTemplate();
		}

		if ( this.state.templateInProcess ) {
			this.setState( {
				templateInProcess: false,
			} );
		}

		// Set controlled blocks value from parent, if any.
		if ( __experimentalBlocks ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( __experimentalBlocks, false );
		}
	}

	componentDidUpdate( prevProps ) {
		const {
			block,
			templateLock,
			template,
			isLastBlockChangePersistent,
			onInput,
			onChange,
		} = this.props;
		const { innerBlocks } = block;

		this.updateNestedSettings();
		// Only synchronize innerBlocks with template if innerBlocks are empty or a locking all exists directly on the block.
		if ( innerBlocks.length === 0 || templateLock === 'all' ) {
			const hasTemplateChanged = ! isEqual(
				template,
				prevProps.template
			);
			if ( hasTemplateChanged ) {
				this.synchronizeBlocksWithTemplate();
			}
		}

		// Sync with controlled blocks value from parent, if possible.
		if ( prevProps.block.innerBlocks !== innerBlocks ) {
			const resetFunc = isLastBlockChangePersistent ? onChange : onInput;
			if ( resetFunc ) {
				resetFunc( innerBlocks );
			}
		}
	}

	/**
	 * Called on mount or when a mismatch exists between the templates and
	 * inner blocks, synchronizes inner blocks with the template, replacing
	 * current blocks.
	 */
	synchronizeBlocksWithTemplate() {
		const { template, block, replaceInnerBlocks } = this.props;
		const { innerBlocks } = block;

		// Synchronize with templates. If the next set differs, replace.
		const nextBlocks = synchronizeBlocksWithTemplate(
			innerBlocks,
			template
		);
		if ( ! isEqual( nextBlocks, innerBlocks ) ) {
			replaceInnerBlocks( nextBlocks );
		}
	}

	updateNestedSettings() {
		const {
			blockListSettings,
			allowedBlocks,
			updateNestedSettings,
			templateLock,
			parentLock,
			__experimentalCaptureToolbars,
			__experimentalMoverDirection,
		} = this.props;

		const newSettings = {
			allowedBlocks,
			templateLock:
				templateLock === undefined ? parentLock : templateLock,
			__experimentalCaptureToolbars:
				__experimentalCaptureToolbars || false,
			__experimentalMoverDirection,
		};

		if ( ! isShallowEqual( blockListSettings, newSettings ) ) {
			updateNestedSettings( newSettings );
		}
	}

	render() {
		const {
			enableClickThrough,
			clientId,
			hasOverlay,
			__experimentalCaptureToolbars: captureToolbars,
			forwardedRef,
			block,
			...props
		} = this.props;
		const { templateInProcess } = this.state;

		if ( templateInProcess ) {
			return null;
		}

		const classes = classnames( {
			'has-overlay': enableClickThrough && hasOverlay,
			'is-capturing-toolbar': captureToolbars,
		} );

		let blockList = (
			<BlockList
				{ ...props }
				ref={ forwardedRef }
				rootClientId={ clientId }
				className={ classes }
			/>
		);

		// Wrap context provider if (and only if) block has context to provide.
		const blockType = getBlockType( block.name );
		if ( blockType && blockType.providesContext ) {
			const context = getBlockContext( block.attributes, blockType );

			blockList = (
				<BlockContextProvider value={ context }>
					{ blockList }
				</BlockContextProvider>
			);
		}

		if ( props.__experimentalTagName ) {
			return blockList;
		}

		return (
			<div className="block-editor-inner-blocks" ref={ forwardedRef }>
				{ blockList }
			</div>
		);
	}
}

const ComposedInnerBlocks = compose( [
	withViewportMatch( { isSmallScreen: '< medium' } ),
	withBlockEditContext( ( context ) => pick( context, [ 'clientId' ] ) ),
	withSelect( ( select, ownProps ) => {
		const {
			isBlockSelected,
			hasSelectedInnerBlock,
			getBlock,
			getBlockListSettings,
			getBlockRootClientId,
			getTemplateLock,
			isNavigationMode,
			isLastBlockChangePersistent,
		} = select( 'core/block-editor' );
		const { clientId, isSmallScreen } = ownProps;
		const block = getBlock( clientId );
		const rootClientId = getBlockRootClientId( clientId );

		return {
			block,
			blockListSettings: getBlockListSettings( clientId ),
			hasOverlay:
				block.name !== 'core/template' &&
				! isBlockSelected( clientId ) &&
				! hasSelectedInnerBlock( clientId, true ),
			parentLock: getTemplateLock( rootClientId ),
			enableClickThrough: isNavigationMode() || isSmallScreen,
			isLastBlockChangePersistent: isLastBlockChangePersistent(),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			replaceInnerBlocks,
			__unstableMarkNextChangeAsNotPersistent,
			updateBlockListSettings,
		} = dispatch( 'core/block-editor' );
		const {
			block,
			clientId,
			templateInsertUpdatesSelection = true,
		} = ownProps;

		return {
			replaceInnerBlocks( blocks, forceUpdateSelection ) {
				replaceInnerBlocks(
					clientId,
					blocks,
					forceUpdateSelection !== undefined
						? forceUpdateSelection
						: block.innerBlocks.length === 0 &&
								templateInsertUpdatesSelection &&
								blocks.length !== 0
				);
			},
			__unstableMarkNextChangeAsNotPersistent,
			updateNestedSettings( settings ) {
				dispatch( updateBlockListSettings( clientId, settings ) );
			},
		};
	} ),
] )( InnerBlocks );

const ForwardedInnerBlocks = forwardRef( ( props, ref ) => {
	const fallbackRef = useRef();
	return (
		<ComposedInnerBlocks { ...props } forwardedRef={ ref || fallbackRef } />
	);
} );

// Expose default appender placeholders as components.
ForwardedInnerBlocks.DefaultBlockAppender = DefaultBlockAppender;
ForwardedInnerBlocks.ButtonBlockAppender = ButtonBlockAppender;

ForwardedInnerBlocks.Content = withBlockContentContext(
	( { BlockContent } ) => <BlockContent />
);

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inner-blocks/README.md
 */
export default ForwardedInnerBlocks;
