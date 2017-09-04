/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getBlockType, registerBlockType } from '../../api';
import { NewReusableBlockDialog, SaveConfirmationDialog } from './dialogs';

const SAVE_CONFIRMATION_HIDE = 'hide';
const SAVE_CONFIRMATION_SHOW = 'show';
const SAVE_CONFIRMATION_DISABLE = 'disable';

class ReusableBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.setName = this.setName.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.confirmSave = this.confirmSave.bind( this );

		if ( this.props.reusableBlock ) {
			this.state = { saveConfirmation: SAVE_CONFIRMATION_DISABLE };
		} else {
			this.state = { saveConfirmation: SAVE_CONFIRMATION_HIDE };
			this.props.fetchReusableBlock();
		}
	}

	setName( name ) {
		this.props.updateReusableBlock( { name } );
		this.props.saveReusableBlock();
	}

	setAttributes( attributes ) {
		this.props.updateReusableBlock( { attributes } );

		if ( this.state.saveConfirmation !== SAVE_CONFIRMATION_DISABLE ) {
			this.setState( { saveConfirmation: SAVE_CONFIRMATION_SHOW } );
		} else {
			this.props.saveReusableBlock();
		}
	}

	confirmSave() {
		this.setState( { saveConfirmation: SAVE_CONFIRMATION_DISABLE } );
		this.props.saveReusableBlock();
	}

	render() {
		const { reusableBlock, attachBlock } = this.props;
		const { saveConfirmation } = this.state;

		if ( ! reusableBlock ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! reusableBlock.name ) {
			return <NewReusableBlockDialog onCreate={ this.setName } onCancel={ attachBlock } />;
		}

		if ( saveConfirmation === SAVE_CONFIRMATION_SHOW ) {
			return <SaveConfirmationDialog onConfirm={ this.confirmSave } onCancel={ attachBlock } />;
		}

		const blockType = getBlockType( reusableBlock.type );
		const BlockEdit = blockType.edit || blockType.create;

		return (
			<BlockEdit
				{ ...this.props }
				attributes={ reusableBlock.attributes }
				setAttributes={ this.setAttributes }
			/>
		);
	}
}

/**
 * TODO:
 * These should use selectors and action creators that we gather from context.
 * OR this entire component should move to `editor`, I can't decide.
 */
const ConnectedReusableBlockEdit = connect(
	( state, ownProps ) => ( {
		reusableBlock: state.reusableBlocks[ ownProps.attributes.ref ],
	} ),
	( dispatch, ownProps ) => ( {
		fetchReusableBlock() {
			dispatch( {
				type: 'FETCH_REUSABLE_BLOCK',
				id: ownProps.attributes.ref,
			} );
		},
		updateReusableBlock( reusableBlock ) {
			dispatch( {
				type: 'UPDATE_REUSABLE_BLOCK',
				id: ownProps.attributes.ref,
				reusableBlock,
			} );
		},
		saveReusableBlock() {
			dispatch( {
				type: 'SAVE_REUSABLE_BLOCK',
				id: ownProps.attributes.ref,
			} );
		},
		attachBlock() {
			dispatch( {
				type: 'ATTACH_BLOCK',
				uid: ownProps.id,
			} );
		},
	} )
)( ReusableBlockEdit );

registerBlockType( 'core/reusable-block', {
	title: __( 'Reusable Block' ),
	category: null,

	attributes: {
		ref: {
			type: 'string',
		},
	},

	edit: ConnectedReusableBlockEdit,
	save: () => null,
} );
