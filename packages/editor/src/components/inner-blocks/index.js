/**
 * External dependencies
 */
import { pick, isEqual, map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withViewportMatch } from '@wordpress/viewport';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { synchronizeBlocksWithTemplate, withBlockContentContext } from '@wordpress/blocks';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import { withBlockEditContext } from '../block-edit/context';

class InnerBlocks extends Component {
	constructor() {
		super( ...arguments );

		this.updateNestedSettings();
	}

	componentDidMount() {
		this.synchronizeBlocksWithTemplate();
	}

	componentDidUpdate( prevProps ) {
		const { template } = this.props;

		this.updateNestedSettings();

		const hasTemplateChanged = ! isEqual( template, prevProps.template );
		if ( hasTemplateChanged ) {
			this.synchronizeBlocksWithTemplate();
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
			templateLock,
			parentLock,
			updateNestedSettings,
		} = this.props;

		const newSettings = {
			allowedBlocks,
			templateLock: templateLock === undefined ? parentLock : templateLock,
		};

		if ( ! isShallowEqual( blockListSettings, newSettings ) ) {
			updateNestedSettings( newSettings );
		}
	}

	render() {
		const {
			clientId,
			layouts,
			allowedBlocks,
			templateLock,
			template,
			isEmpty,
			isSmallScreen,
			isSelectedBlockInRoot,
			showWhenEmpty,
			className,
		} = this.props;

		const classes = classnames( className, 'editor-inner-blocks', {
			'has-overlay': isSmallScreen && ! isSelectedBlockInRoot,
		} );

		return (
			<div className={ classes }>
				{ isEmpty && showWhenEmpty }
				<BlockList
					rootClientId={ clientId }
					{ ...{ layouts, allowedBlocks, templateLock, template } }
				/>
			</div>
		);
	}
}

InnerBlocks = compose( [
	withBlockEditContext( ( context ) => pick( context, [ 'clientId' ] ) ),
	withViewportMatch( { isSmallScreen: '< medium' } ),
	withSelect( ( select, ownProps ) => {
		const {
			isBlockSelected,
			hasSelectedInnerBlock,
			getBlock,
			getBlockListSettings,
			getBlockRootClientId,
			getTemplateLock,
			getBlockOrder,
		} = select( 'core/editor' );
		const { clientId } = ownProps;
		const parentClientId = getBlockRootClientId( clientId );
		const blocksInside = getBlockOrder( clientId );
		return {
			isSelectedBlockInRoot: isBlockSelected( clientId ) || hasSelectedInnerBlock( clientId ),
			block: getBlock( clientId ),
			blockListSettings: getBlockListSettings( clientId ),
			parentLock: getTemplateLock( parentClientId ),
			isEmpty: blocksInside && blocksInside.length === 0,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			replaceBlocks,
			insertBlocks,
			updateBlockListSettings,
		} = dispatch( 'core/editor' );
		const { block, clientId } = ownProps;

		return {
			replaceInnerBlocks( blocks ) {
				const clientIds = map( block.innerBlocks, 'clientId' );
				if ( clientIds.length ) {
					replaceBlocks( clientIds, blocks );
				} else {
					insertBlocks( blocks, undefined, clientId );
				}
			},
			updateNestedSettings( settings ) {
				dispatch( updateBlockListSettings( clientId, settings ) );
			},
		};
	} ),
] )( InnerBlocks );

InnerBlocks.Content = withBlockContentContext(
	( { BlockContent } ) => <BlockContent />
);

export default InnerBlocks;
