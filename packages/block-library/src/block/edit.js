/**
 * External dependencies
 */
import { noop, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEdit } from '@wordpress/editor';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';
import ReusableBlockIndicator from './indicator';

class ReusableBlockEdit extends Component {
	constructor( { reusableBlock } ) {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.setTitle = this.setTitle.bind( this );
		this.save = this.save.bind( this );

		if ( reusableBlock && reusableBlock.isTemporary ) {
			// Start in edit mode when we're working with a newly created reusable block
			this.state = {
				isEditing: true,
				title: reusableBlock.title,
				changedAttributes: {},
			};
		} else {
			// Start in preview mode when we're working with an existing reusable block
			this.state = {
				isEditing: false,
				title: null,
				changedAttributes: null,
			};
		}
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
			changedAttributes: {},
		} );
	}

	stopEditing() {
		this.setState( {
			isEditing: false,
			title: null,
			changedAttributes: null,
		} );
	}

	setAttributes( attributes ) {
		this.setState( ( prevState ) => {
			if ( prevState.changedAttributes !== null ) {
				return { changedAttributes: { ...prevState.changedAttributes, ...attributes } };
			}
		} );
	}

	setTitle( title ) {
		this.setState( { title } );
	}

	save() {
		const { reusableBlock, onUpdateTitle, updateAttributes, block, onSave } = this.props;
		const { title, changedAttributes } = this.state;

		if ( title !== reusableBlock.title ) {
			onUpdateTitle( title );
		}

		updateAttributes( block.clientId, changedAttributes );
		onSave();

		this.stopEditing();
	}

	render() {
		const { isSelected, reusableBlock, block, isFetching, isSaving, canUpdateBlock } = this.props;
		const { isEditing, title, changedAttributes } = this.state;

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
				clientId={ block.clientId }
				name={ block.name }
				attributes={ { ...block.attributes, ...changedAttributes } }
				setAttributes={ isEditing ? this.setAttributes : noop }
			/>
		);

		if ( ! isEditing ) {
			element = <Disabled>{ element }</Disabled>;
		}

		return (
			<Fragment>
				{ ( isSelected || isEditing ) && (
					<ReusableBlockEditPanel
						isEditing={ isEditing }
						title={ title !== null ? title : reusableBlock.title }
						isSaving={ isSaving && ! reusableBlock.isTemporary }
						isEditDisabled={ ! canUpdateBlock }
						onEdit={ this.startEditing }
						onChangeTitle={ this.setTitle }
						onSave={ this.save }
						onCancel={ this.stopEditing }
					/>
				) }
				{ ! isSelected && ! isEditing && <ReusableBlockIndicator title={ reusableBlock.title } /> }
				{ element }
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const {
			__experimentalGetReusableBlock: getReusableBlock,
			__experimentalIsFetchingReusableBlock: isFetchingReusableBlock,
			__experimentalIsSavingReusableBlock: isSavingReusableBlock,
			getBlock,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );

		const { ref } = ownProps.attributes;
		const reusableBlock = getReusableBlock( ref );

		return {
			reusableBlock,
			isFetching: isFetchingReusableBlock( ref ),
			isSaving: isSavingReusableBlock( ref ),
			block: reusableBlock ? getBlock( reusableBlock.clientId ) : null,
			canUpdateBlock: !! reusableBlock && ! reusableBlock.isTemporary && !! canUser( 'update', 'blocks', ref ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			__experimentalFetchReusableBlocks: fetchReusableBlocks,
			updateBlockAttributes,
			__experimentalUpdateReusableBlockTitle: updateReusableBlockTitle,
			__experimentalSaveReusableBlock: saveReusableBlock,
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
