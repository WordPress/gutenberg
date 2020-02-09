/**
 * External dependencies
 */
import { pick, isEqual } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withViewportMatch } from '@wordpress/viewport';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import {
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
import { withBlockEditContext } from '../block-edit/context';

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
			replaceInnerBlocks( __experimentalBlocks );
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
			__experimentalUIParts,
		} = this.props;

		const newSettings = {
			allowedBlocks,
			templateLock:
				templateLock === undefined ? parentLock : templateLock,
			__experimentalCaptureToolbars:
				__experimentalCaptureToolbars || false,
			__experimentalMoverDirection,
			__experimentalUIParts,
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
			...props
		} = this.props;
		const { templateInProcess } = this.state;

		const classes = classnames( 'block-editor-inner-blocks', {
			'has-overlay': enableClickThrough && hasOverlay,
			'is-capturing-toolbar': captureToolbars,
		} );

		return (
			<div className={ classes }>
				{ ! templateInProcess && (
					<BlockList rootClientId={ clientId } { ...props } />
				) }
			</div>
		);
	}
}

InnerBlocks = compose( [
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
			replaceInnerBlocks( blocks ) {
				replaceInnerBlocks(
					clientId,
					blocks,
					block.innerBlocks.length === 0 &&
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

// Expose default appender placeholders as components.
InnerBlocks.DefaultBlockAppender = DefaultBlockAppender;
InnerBlocks.ButtonBlockAppender = ButtonBlockAppender;

InnerBlocks.Content = withBlockContentContext( ( { BlockContent } ) => (
	<BlockContent />
) );

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inner-blocks/README.md
 */
export default InnerBlocks;
