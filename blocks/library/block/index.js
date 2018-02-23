/**
 * External dependencies
 */
import { pickBy, noop } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockEdit from '../../block-edit';
import ReusableBlockEditPanel from './edit-panel';

class ReusableBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.setTitle = this.setTitle.bind( this );
		this.updateReusableBlock = this.updateReusableBlock.bind( this );

		this.state = {
			isEditing: false,
			title: null,
			attributes: null,
		};
	}

	componentDidMount() {
		if ( ! this.props.reusableBlock ) {
			this.props.fetchReusableBlock();
		}
	}

	/**
	 * @inheritdoc
	 */
	componentWillReceiveProps( nextProps ) {
		if ( this.props.focus && ! nextProps.focus ) {
			this.stopEditing();
		}
	}

	startEditing() {
		this.setState( { isEditing: true } );
	}

	stopEditing() {
		this.setState( {
			isEditing: false,
			title: null,
			attributes: null,
		} );
	}

	setAttributes( attributes ) {
		this.setState( ( prevState ) => ( {
			attributes: { ...prevState.attributes, ...attributes },
		} ) );
	}

	setTitle( title ) {
		this.setState( { title } );
	}

	updateReusableBlock() {
		const { title, attributes } = this.state;

		// Use pickBy to include only changed (assigned) values in payload
		const payload = pickBy( {
			title,
			attributes,
		} );

		this.props.updateReusableBlock( payload );
		this.props.saveReusableBlock();
		this.stopEditing();
	}

	render() {
		const { isSelected, reusableBlock, isFetching, isSaving } = this.props;
		const { isEditing, title, attributes } = this.state;

		if ( ! reusableBlock && isFetching ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! reusableBlock ) {
			return <Placeholder>{ __( 'Block has been deleted or is unavailable.' ) }</Placeholder>;
		}

		const reusableBlockAttributes = { ...reusableBlock.attributes, ...attributes };

		let element = (
			<BlockEdit
				{ ...this.props }
				name={ reusableBlock.type }
				isSelected={ isEditing && isSelected }
				attributes={ reusableBlockAttributes }
				setAttributes={ isEditing ? this.setAttributes : noop }
			/>
		);

		if ( ! isEditing ) {
			element = <Disabled>{ element }</Disabled>;
		}

		return (
			<Fragment>
				{ element }
				{ isSelected && (
					<ReusableBlockEditPanel
						isEditing={ isEditing }
						title={ title !== null ? title : reusableBlock.title }
						isSaving={ isSaving && ! reusableBlock.isTemporary }
						onEdit={ this.startEditing }
						onChangeTitle={ this.setTitle }
						onSave={ this.updateReusableBlock }
						onCancel={ this.stopEditing }
					/>
				) }
			</Fragment>
		);
	}
}

const ConnectedReusableBlockEdit = connect(
	( state, ownProps ) => ( {
		reusableBlock: state.reusableBlocks.data[ ownProps.attributes.ref ],
		isFetching: state.reusableBlocks.isFetching[ ownProps.attributes.ref ],
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
	} )
)( ReusableBlockEdit );

export const name = 'core/block';

export const settings = {
	title: __( 'Reusable Block' ),
	category: 'reusable-blocks',
	isPrivate: true,

	attributes: {
		ref: {
			type: 'number',
		},
	},

	supports: {
		customClassName: false,
		html: false,
	},

	edit: ConnectedReusableBlockEdit,
	save: () => null,
};
