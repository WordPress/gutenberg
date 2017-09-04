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
import { NewReusableBlockDialog, PersistConfirmationDialog } from './dialogs';

const PERSIST_CONFIRMATION_HIDE = 'hide';
const PERSIST_CONFIRMATION_SHOW = 'show';
const PERSIST_CONFIRMATION_DISABLE = 'disable';

class ReusableBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.setName = this.setName.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.confirmPersist = this.confirmPersist.bind( this );

		if ( this.props.reusableBlock ) {
			this.state = { persistConfirmation: PERSIST_CONFIRMATION_DISABLE };
		} else {
			this.state = { persistConfirmation: PERSIST_CONFIRMATION_HIDE };
			this.props.fetchReusableBlock();
		}
	}

	setName( name ) {
		this.props.updateReusableBlock( { name } );
		this.props.persistReusableBlock();
	}

	setAttributes( attributes ) {
		this.props.updateReusableBlock( { attributes } );

		if ( this.state.persistConfirmation !== PERSIST_CONFIRMATION_DISABLE ) {
			this.setState( { persistConfirmation: PERSIST_CONFIRMATION_SHOW } );
		} else {
			this.props.persistReusableBlock();
		}
	}

	confirmPersist() {
		this.setState( { persistConfirmation: PERSIST_CONFIRMATION_DISABLE } );
		this.props.persistReusableBlock();
	}

	render() {
		const { reusableBlock, attachReusableBlock } = this.props;
		const { persistConfirmation } = this.state;

		if ( ! reusableBlock ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! reusableBlock.name ) {
			return <NewReusableBlockDialog onCreate={ this.setName } onCancel={ attachReusableBlock } />;
		}

		if ( persistConfirmation === PERSIST_CONFIRMATION_SHOW ) {
			return <PersistConfirmationDialog onConfirm={ this.confirmPersist } onCancel={ attachReusableBlock } />;
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
				ref: ownProps.attributes.ref,
			} );
		},
		updateReusableBlock( reusableBlock ) {
			dispatch( {
				type: 'UPDATE_REUSABLE_BLOCK',
				ref: ownProps.attributes.ref,
				reusableBlock,
			} );
		},
		persistReusableBlock() {
			dispatch( {
				type: 'PERSIST_REUSABLE_BLOCK',
				ref: ownProps.attributes.ref,
			} );
		},
		attachReusableBlock() {
			dispatch( {
				type: 'ATTACH_REUSABLE_BLOCK',
				uid: ownProps.id,
			} );
		},
		detachReusableBlock() {
			dispatch( {
				type: 'DETACH_REUSABLE_BLOCK',
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
