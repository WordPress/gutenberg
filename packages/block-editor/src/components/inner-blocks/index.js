/**
 * External dependencies
 */
import { pick, isEqual } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { synchronizeBlocksWithTemplate, withBlockContentContext } from '@wordpress/blocks';
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
import TemplatePicker from './template-picker';

class InnerBlocks extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			templateInProcess: !! this.props.template,
		};
		this.updateNestedSettings();
	}

	getTemplateLock() {
		const {
			templateLock,
			parentLock,
		} = this.props;
		return templateLock === undefined ? parentLock : templateLock;
	}

	componentDidMount() {
		const { innerBlocks } = this.props.block;
		// only synchronize innerBlocks with template if innerBlocks are empty or a locking all exists
		if ( innerBlocks.length === 0 || this.getTemplateLock() === 'all' ) {
			this.synchronizeBlocksWithTemplate();
		}

		if ( this.state.templateInProcess ) {
			this.setState( {
				templateInProcess: false,
			} );
		}
	}

	componentDidUpdate( prevProps ) {
		const { template, block } = this.props;
		const { innerBlocks } = block;

		this.updateNestedSettings();
		// only synchronize innerBlocks with template if innerBlocks are empty or a locking all exists
		if ( innerBlocks.length === 0 || this.getTemplateLock() === 'all' ) {
			const hasTemplateChanged = ! isEqual( template, prevProps.template );
			if ( hasTemplateChanged ) {
				this.synchronizeBlocksWithTemplate();
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
		const nextBlocks = synchronizeBlocksWithTemplate( innerBlocks, template );
		if ( ! isEqual( nextBlocks, innerBlocks	) ) {
			replaceInnerBlocks( nextBlocks );
		}
	}

	updateNestedSettings() {
		const {
			blockListSettings,
			allowedBlocks,
			updateNestedSettings,
		} = this.props;

		const newSettings = {
			allowedBlocks,
			templateLock: this.getTemplateLock(),
		};

		if ( ! isShallowEqual( blockListSettings, newSettings ) ) {
			updateNestedSettings( newSettings );
		}
	}

	render() {
		const {
			clientId,
			hasOverlay,
			renderAppender,
			template,
			__experimentalTemplateOptions: templateOptions,
			__experimentalOnSelectTemplateOption: onSelectTemplateOption,
			__experimentalAllowTemplateOptionSkip: allowTemplateOptionSkip,
		} = this.props;
		const { templateInProcess } = this.state;

		const isPlaceholder = template === null && !! templateOptions;

		const classes = classnames( 'editor-inner-blocks block-editor-inner-blocks', {
			'has-overlay': hasOverlay && ! isPlaceholder,
		} );

		return (
			<div className={ classes }>
				{ ! templateInProcess && (
					isPlaceholder ?
						<TemplatePicker
							options={ templateOptions }
							onSelect={ onSelectTemplateOption }
							allowSkip={ allowTemplateOptionSkip }
						/> :
						<BlockList
							rootClientId={ clientId }
							renderAppender={ renderAppender }
						/>
				) }
			</div>
		);
	}
}

InnerBlocks = compose( [
	withBlockEditContext( ( context ) => pick( context, [ 'clientId' ] ) ),
	withSelect( ( select, ownProps ) => {
		const {
			isBlockSelected,
			hasSelectedInnerBlock,
			getBlock,
			getBlockListSettings,
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const { clientId } = ownProps;
		const block = getBlock( clientId );
		const rootClientId = getBlockRootClientId( clientId );

		return {
			block,
			blockListSettings: getBlockListSettings( clientId ),
			hasOverlay: block.name !== 'core/template' && ! isBlockSelected( clientId ) && ! hasSelectedInnerBlock( clientId, true ),
			parentLock: getTemplateLock( rootClientId ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			replaceInnerBlocks,
			updateBlockListSettings,
		} = dispatch( 'core/block-editor' );
		const { block, clientId, templateInsertUpdatesSelection = true } = ownProps;

		return {
			replaceInnerBlocks( blocks ) {
				replaceInnerBlocks( clientId, blocks, block.innerBlocks.length === 0 && templateInsertUpdatesSelection );
			},
			updateNestedSettings( settings ) {
				dispatch( updateBlockListSettings( clientId, settings ) );
			},
		};
	} ),
] )( InnerBlocks );

// Expose default appender placeholders as components.
InnerBlocks.DefaultBlockAppender = DefaultBlockAppender;
InnerBlocks.ButtonBlockAppender = ButtonBlockAppender;

InnerBlocks.Content = withBlockContentContext(
	( { BlockContent } ) => <BlockContent />
);

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inner-blocks/README.md
 */
export default InnerBlocks;
