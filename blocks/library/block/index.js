/**
 * External dependencies
 */
import { noop, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment, compose } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockEdit from '../../block-edit';
import ReusableBlockEditPanel from './edit-panel';

class ReusableBlockEdit extends Component {
	constructor( { reusableBlock } ) {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.setTitle = this.setTitle.bind( this );
		this.save = this.save.bind( this );

		this.state = {
			isEditing: !! ( reusableBlock && reusableBlock.isTemporary ),
			title: null,
		};
	}

	componentDidMount() {
		if ( ! this.props.reusableBlock ) {
			this.props.fetchReusableBlock();
		}
	}

	startEditing() {
		const { reusableBlock } = this.props;

		this.setState( {
			isEditing: true,
			title: reusableBlock.title,
		} );
	}

	stopEditing() {
		this.setState( {
			isEditing: false,
			title: null,
		} );
	}

	setAttributes( attributes ) {
		const { updateAttributes, block } = this.props;
		updateAttributes( block.uid, attributes );
	}

	setTitle( title ) {
		this.setState( { title } );
	}

	save() {
		const { reusableBlock, onUpdateTitle, onSave } = this.props;

		const { title } = this.state;
		if ( title !== reusableBlock.title ) {
			onUpdateTitle( title );
		}

		onSave();

		this.stopEditing();
	}

	render() {
		const { isSelected, reusableBlock, block, isFetching, isSaving } = this.props;
		const { isEditing, title } = this.state;

		if ( ! reusableBlock && isFetching ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! reusableBlock || ! block ) {
			return <Placeholder>{ __( 'Block has been deleted or is unavailable.' ) }</Placeholder>;
		}

		let element = (
			<BlockEdit
				{ ...this.props }
				isSelected={ isEditing && isSelected }
				id={ block.uid }
				name={ block.name }
				attributes={ block.attributes }
				setAttributes={ isEditing ? this.setAttributes : noop }
			/>
		);

		if ( ! isEditing ) {
			element = <Disabled>{ element }</Disabled>;
		}

		return (
			<Fragment>
				{ element }
				{ ( isSelected || isEditing ) && (
					<ReusableBlockEditPanel
						isEditing={ isEditing }
						title={ title !== null ? title : reusableBlock.title }
						isSaving={ isSaving && ! reusableBlock.isTemporary }
						onEdit={ this.startEditing }
						onChangeTitle={ this.setTitle }
						onSave={ this.save }
						onCancel={ this.stopEditing }
					/>
				) }
			</Fragment>
		);
	}
}

const EnhancedReusableBlockEdit = compose( [
	withSelect( ( select, ownProps ) => {
		const {
			getReusableBlock,
			isFetchingReusableBlock,
			isSavingReusableBlock,
			getBlock,
		} = select( 'core/editor' );
		const { ref } = ownProps.attributes;
		const reusableBlock = getReusableBlock( ref );

		return {
			reusableBlock,
			isFetching: isFetchingReusableBlock( ref ),
			isSaving: isSavingReusableBlock( ref ),
			block: reusableBlock ? getBlock( reusableBlock.uid ) : null,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			fetchReusableBlocks,
			updateBlockAttributes,
			updateReusableBlockTitle,
			saveReusableBlock,
		} = dispatch( 'core/editor' );
		const { ref } = ownProps.attributes;

		return {
			fetchReusableBlock: partial( fetchReusableBlocks, ref ),
			updateAttributes: updateBlockAttributes,
			onUpdateTitle: partial( updateReusableBlockTitle, ref ),
			onSave: partial( saveReusableBlock, ref ),
		};
	} ),
] )( ReusableBlockEdit );

export const name = 'core/block';

export const settings = {
	title: __( 'Shared Block' ),
	category: 'shared',
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

	edit: EnhancedReusableBlockEdit,
	save: () => null,
};
