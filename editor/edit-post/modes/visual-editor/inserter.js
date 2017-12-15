/**
 * External dependencies
 */
import { find } from 'lodash';
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { createBlock, BlockIcon } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Inserter } from '../../../components';
import { insertBlock } from '../../../actions';
import { getMostFrequentlyUsedBlocks, getBlockCount, getBlocks } from '../../../selectors';

export class VisualEditorInserter extends Component {
	constructor() {
		super( ...arguments );

		this.showControls = this.toggleControls.bind( this, true );
		this.hideControls = this.toggleControls.bind( this, false );

		this.state = {
			isShowingControls: false,
		};
	}

	toggleControls( isShowingControls ) {
		this.setState( { isShowingControls } );
	}

	insertBlock( name ) {
		const { onInsertBlock } = this.props;
		onInsertBlock( createBlock( name ) );
	}

	isDisabledBlock( block ) {
		return block.useOnce && find( this.props.blocks, ( { name } ) => block.name === name );
	}

	render() {
		const { blockCount, isLocked } = this.props;
		const { isShowingControls } = this.state;
		const { mostFrequentlyUsedBlocks } = this.props;
		const classes = classnames( 'editor-visual-editor__inserter', {
			'is-showing-controls': isShowingControls,
		} );

		if ( isLocked ) {
			return null;
		}

		return (
			<div
				className={ classes }
				onFocus={ this.showControls }
				onBlur={ this.hideControls }
			>
				<Inserter
					insertIndex={ blockCount }
					position="top right" />
				{ mostFrequentlyUsedBlocks && mostFrequentlyUsedBlocks.map( ( block ) => (
					<IconButton
						key={ 'frequently_used_' + block.name }
						className="editor-inserter__block"
						onClick={ () => this.insertBlock( block.name ) }
						label={ sprintf( __( 'Insert %s' ), block.title ) }
						disabled={ this.isDisabledBlock( block ) }
						icon={ (
							<span className="editor-visual-editor__inserter-block-icon">
								<BlockIcon icon={ block.icon } />
							</span>
						) }
					>
						{ block.title }
					</IconButton>
				) ) }
			</div>
		);
	}
}

export default compose(
	connect(
		( state ) => {
			return {
				mostFrequentlyUsedBlocks: getMostFrequentlyUsedBlocks( state ),
				blockCount: getBlockCount( state ),
				blocks: getBlocks( state ),
			};
		},
		{ onInsertBlock: insertBlock },
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( VisualEditorInserter );
