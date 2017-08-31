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

const PERSIST_CONFIRMATION_HIDE = 'hide';
const PERSIST_CONFIRMATION_SHOW = 'show';
const PERSIST_CONFIRMATION_DISABLE = 'disable';

class ReusableBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.setAttributes = this.setAttributes.bind( this );

		if ( this.props.reusableBlock ) {
			this.state = { persistConfirmation: PERSIST_CONFIRMATION_DISABLE };
		} else {
			this.state = { persistConfirmation: PERSIST_CONFIRMATION_HIDE };
			this.props.fetchReusableBlock();
		}
	}

	setName( name ) {
		this.props.setReusableBlockName( name );
	}

	setAttributes( attributes ) {
		this.props.updateReusableBlockAttributes( attributes );

		if ( this.state.persistConfirmation !== PERSIST_CONFIRMATION_DISABLE ) {
			this.setState( { persistConfirmation: PERSIST_CONFIRMATION_SHOW } );
		} else {
			this.props.persistReusableBlock();
		}
	}

	confirmPersist() {
		this.setState( { showPersistConfirmation: PERSIST_CONFIRMATION_DISABLE } );
		this.props.persistReusableBlock();
	}

	render() {
		const { reusableBlock } = this.props;
		const { persistConfirmation } = this.state;

		if ( ! reusableBlock ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! reusableBlock.name ) {
			// return <CreateReusableBlockPrompt onCreate={ this.setName } onCancel={ this.attachReusableBlock } />
			return <p>Please name this reusable block blah blah</p>;
		}

		if ( persistConfirmation === PERSIST_CONFIRMATION_SHOW ) {
			// show prompt that asks for confirmation
			// user can 'Edit across all instances' (persistReusableBlock)
			// or 'Detach from Reusable Block' (detachReusableBlock)
			// or 'Cancel' (idk actually...)
			// return <PersistReusableBlockPrompt onPersist={ this.confirmPersist } onDetach={ this.detachReusableBlock } />
			return <p>You are editing a reusable block blah blah</p>;
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
		setReusableBlockName( name ) {
			dispatch( {
				type: 'SET_REUSABLE_BLOCK_NAME',
				ref: ownProps.attributes.ref,
				name,
			} );
		},
		updateReusableBlockAttributes( attributes ) {
			dispatch( {
				type: 'UPDATE_REUSABLE_BLOCK_ATTRIBUTES',
				ref: ownProps.attributes.ref,
				attributes,
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
				ref: ownProps.attributes.ref,
			} );
		},
		detachReusableBlock() {
			dispatch( {
				type: 'DETACH_REUSABLE_BLOCK',
				ref: ownProps.attributes.ref,
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
