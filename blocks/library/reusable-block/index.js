/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Spinner, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getBlockType, registerBlockType } from '../../api';
import NewReusableBlockDialog from './new-reusable-block';
import SaveConfirmationDialog from './save-confirmation';

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

		const blockType = getBlockType( reusableBlock.type );
		const BlockEdit = blockType.edit || blockType.create;

		return (
			<div>
				{ ! reusableBlock.name &&
					<Modal>
						<NewReusableBlockDialog onCreate={ this.setName } onCancel={ attachBlock } />
					</Modal>
				}
				{ saveConfirmation === SAVE_CONFIRMATION_SHOW &&
					<Modal>
						<SaveConfirmationDialog onConfirm={ this.confirmSave } onCancel={ attachBlock } />
					</Modal>
				}
				<BlockEdit
					{ ...this.props }
					attributes={ reusableBlock.attributes }
					setAttributes={ this.setAttributes }
				/>
			</div>
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
