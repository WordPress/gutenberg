/**
 * External dependencies
 */
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
import { clearSelectedBlock, insertBlock } from '../../../store/actions';
import { getFrequentInserterItems, getBlockCount } from '../../../store/selectors';

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

		if ( isShowingControls && this.props.clearSelectedBlock ) {
			this.props.clearSelectedBlock();
		}
	}

	/**
	 * Invoked when a inserter item is selected from the quick inserter.
	 * Dispatches an action to create the necessary block.
	 * 
	 * @param {Editor.InserterItem} item Selected inserter item.
	 */
	insertItem( { name, initialAttributes } ) {
		this.props.insertBlock( createBlock( name, initialAttributes ) );
	}

	render() {
		const { blockCount, isLocked } = this.props;
		const { isShowingControls } = this.state;
		const { frequentInserterItems } = this.props;
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
				{ frequentInserterItems.map( ( item ) => (
					<IconButton
						key={ 'frequently_used_' + item.name }
						className="editor-inserter__block"
						onClick={ () => this.insertItem( item ) }
						label={ sprintf( __( 'Add %s' ), item.title ) }
						disabled={ item.isDisabled }
						icon={ (
							<span className="editor-visual-editor__inserter-block-icon">
								<BlockIcon icon={ item.icon } />
							</span>
						) }
					>
						{ item.title }
					</IconButton>
				) ) }
			</div>
		);
	}
}

export default compose(
	withContext( 'editor' )( ( settings ) => {
		const { templateLock, blockTypes } = settings;

		return {
			isLocked: !! templateLock,
			enabledBlockTypes: blockTypes,
		};
	} ),
	connect(
		( state, ownProps ) => {
			return {
				frequentInserterItems: getFrequentInserterItems( state, ownProps.enabledBlockTypes ),
				blockCount: getBlockCount( state ),
			};
		},
		{
			insertBlock,
			clearSelectedBlock,
		},
	),
)( VisualEditorInserter );
