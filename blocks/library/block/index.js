/**
 * External dependencies
 */
import { pickBy, noop } from 'lodash';
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
import ReusableBlockEditPanel from './edit-panel';

class ReusableBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.setName = this.setName.bind( this );
		this.updateReusableBlock = this.updateReusableBlock.bind( this );

		this.state = {
			isEditing: false,
			name: null,
			attributes: null,
		};
	}

	componentDidMount() {
		if ( ! this.props.reusableBlock ) {
			this.props.fetchReusableBlock();
		}
	}

	startEditing() {
		this.setState( { isEditing: true } );
	}

	stopEditing() {
		this.setState( {
			isEditing: false,
			name: null,
			attributes: null,
		} );
	}

	setAttributes( attributes ) {
		this.setState( ( prevState ) => ( {
			attributes: { ...prevState.attributes, ...attributes },
		} ) );
	}

	setName( name ) {
		this.setState( { name } );
	}

	updateReusableBlock() {
		const { name, attributes } = this.state;

		// Use pickBy to include only changed (assigned) values in payload
		const payload = pickBy( {
			name,
			attributes,
		} );

		this.props.updateReusableBlock( payload );
		this.props.saveReusableBlock();
		this.stopEditing();
	}

	render() {
		const { focus, reusableBlock, isSaving, convertBlockToStatic } = this.props;
		const { isEditing, name, attributes } = this.state;

		if ( ! reusableBlock ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		const reusableBlockAttributes = { ...reusableBlock.attributes, ...attributes };
		const blockType = getBlockType( reusableBlock.type );
		const BlockEdit = blockType.edit || blockType.save;

		return [
			// We fake the block being read-only by wrapping it with an element that has pointer-events: none
			<div key="edit" style={ { pointerEvents: isEditing ? 'auto' : 'none' } }>
				<BlockEdit
					{ ...this.props }
					focus={ isEditing ? focus : null }
					attributes={ reusableBlockAttributes }
					setAttributes={ isEditing ? this.setAttributes : noop }
				/>
			</div>,
			focus && (
				<ReusableBlockEditPanel
					key="panel"
					isEditing={ isEditing }
					name={ name !== null ? name : reusableBlock.name }
					isSaving={ isSaving }
					onEdit={ this.startEditing }
					onDetach={ convertBlockToStatic }
					onChangeName={ this.setName }
					onSave={ this.updateReusableBlock }
					onCancel={ this.stopEditing }
				/>
			),
		];
	}
}

const ConnectedReusableBlockEdit = connect(
	( state, ownProps ) => ( {
		reusableBlock: state.reusableBlocks.data[ ownProps.attributes.ref ],
		isSaving: state.reusableBlocks.isSaving[ ownProps.attributes.ref ],
	} ),
	( dispatch, ownProps ) => ( {
		fetchReusableBlock() {
			dispatch( {
				type: 'FETCH_REUSABLE_BLOCKS',
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
		convertBlockToStatic() {
			dispatch( {
				type: 'CONVERT_BLOCK_TO_STATIC',
				uid: ownProps.id,
			} );
		},
	} )
)( ReusableBlockEdit );

registerBlockType( 'core/block', {
	title: __( 'Reusable Block' ),
	category: 'reusable-blocks',
	isPrivate: true,

	attributes: {
		ref: {
			type: 'number',
		},
	},

	edit: ConnectedReusableBlockEdit,
	save: () => null,
} );
