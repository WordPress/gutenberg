/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { createBlock } from 'blocks';
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import Inserter from './';
import { getBlockTypes } from '../selectors';
import { insertBlock } from '../actions';

class FullInserter extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showContinueWritingControls: false,
		};
		this.toggleContinueWritingControls = this.toggleContinueWritingControls.bind( this );
	}

	insertBlock( name ) {
		const blockType = find( this.props.blockTypes, ( bt ) => bt.name === name );
		const newBlock = createBlock( blockType );
		this.props.onInsertBlock( newBlock );
	}

	toggleContinueWritingControls( showContinueWritingControls ) {
		return () => this.setState( { showContinueWritingControls } );
	}

	render() {
		const continueWritingClassname = classnames( 'editor-inserter__full', {
			'is-showing-controls': this.state.showContinueWritingControls,
		} );

		return (
			<div
				className={ continueWritingClassname }
				onFocus={ this.toggleContinueWritingControls( true ) }
				onBlur={ this.toggleContinueWritingControls( false ) }
			>
				<Inserter position="top right" />
				<IconButton
					icon="text"
					className="editor-inserter__block"
					onClick={ () => this.insertBlock( 'core/text' ) }
					label={ __( 'Insert text block' ) }
				>
					{ __( 'Text' ) }
				</IconButton>
				<IconButton
					icon="format-image"
					className="editor-inserter__block"
					onClick={ () => this.insertBlock( 'core/image' ) }
					label={ __( 'Insert image block' ) }
				>
					{ __( 'Image' ) }
				</IconButton>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		blockTypes: getBlockTypes( state ),
	} ),
	( dispatch ) => ( {
		onInsertBlock( block ) {
			dispatch( insertBlock( block ) );
		},
	} ),
	undefined,
	{
		storeKey: 'editor',
	}
)( FullInserter );
