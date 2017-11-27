/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { createBlock, BlockIcon } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../inserter';
import { insertBlock } from '../../actions';
import { getMostFrequentlyUsedBlocks, getBlockCount } from '../../selectors';

export class InserterWithShortcuts extends Component {
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

	render() {
		const { blockCount } = this.props;
		const { isShowingControls } = this.state;
		const { mostFrequentlyUsedBlocks } = this.props;
		const classes = classnames( 'editor-inserter-with-shortcuts', {
			'is-showing-controls': isShowingControls,
		} );

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
						className="editor-inserter-with-shortcuts__block"
						onClick={ () => this.insertBlock( block.name ) }
						label={ sprintf( __( 'Insert %s' ), block.title ) }
						icon={ (
							<span className="editor-inserter-with-shortcuts__block-icon">
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

export default connect(
	( state ) => {
		return {
			mostFrequentlyUsedBlocks: getMostFrequentlyUsedBlocks( state ),
			blockCount: getBlockCount( state ),
		};
	},
	{ onInsertBlock: insertBlock },
	undefined,
	{ storeKey: 'editorStore' }
)( InserterWithShortcuts );
