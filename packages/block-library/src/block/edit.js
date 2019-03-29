/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Spinner, Disabled, SlotFillProvider } from '@wordpress/components';
import {
	withSelect,
	withDispatch,
	withRegistry,
} from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	BlockList,
	BlockControls,
	BlockFormatControls,
	FormatToolbar,
	__experimentalBlockSettingsMenuFirstItem,
	__experimentalBlockSettingsMenuPluginsExtension,
} from '@wordpress/block-editor';
import { EditorProvider } from '@wordpress/editor';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';
import ReusableBlockIndicator from './indicator';
import SelectionObserver from './selection-observer';

class ReusableBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.startEditing = () => this.toggleIsEditing( true );
		this.stopEditing = () => this.toggleIsEditing( false );
		this.cancelEditing = this.cancelEditing.bind( this );

		this.state = {
			cancelIncrementKey: 0,
			// TODO: Check if this needs to consider reusable block being temporary (this was in original PR)
			isEditing: false,
		};
	}

	/**
	 * Starts or stops editing, corresponding to the given boolean value.
	 *
	 * @param {boolean} isEditing Whether editing mode should be made active.
	 */
	toggleIsEditing( isEditing ) {
		this.setState( { isEditing } );
	}

	/**
	 * Stops editing and restores the reusable block to its original saved
	 * state.
	 */
	cancelEditing() {
		this.stopEditing();

		// Cancelling takes effect by assigning a new key for the rendered
		// EditorProvider which forces a re-mount to reset editing state.
		let { cancelIncrementKey } = this.state;
		cancelIncrementKey++;
		this.setState( { cancelIncrementKey } );
	}

	render() {
		const {
			isSelected,
			reusableBlock,
			isFetching,
			canUpdateBlock,
			settings,
		} = this.props;
		const { cancelIncrementKey, isEditing } = this.state;

		if ( ! reusableBlock ) {
			return (
				<Placeholder>
					{
						isFetching ?
							<Spinner /> :
							__( 'Block has been deleted or is unavailable.' )
					}
				</Placeholder>
			);
		}

		let list = <BlockList />;
		if ( ! isEditing ) {
			list = <Disabled>{ list }</Disabled>;
		}

		return (
			<SlotFillProvider
				slots={ [
					FormatToolbar.Slot,
					BlockControls.Slot,
					BlockFormatControls.Slot,
					__experimentalBlockSettingsMenuFirstItem.Slot,
					__experimentalBlockSettingsMenuPluginsExtension.Slot,
				] }
			>
				<EditorProvider
					key={ cancelIncrementKey }
					post={ reusableBlock }
					settings={ { ...settings, templateLock: ! isEditing } }
				>
					<SelectionObserver
						isParentSelected={ isSelected }
						onBlockSelected={ this.props.selectBlock }
					/>
					{ ( isSelected || isEditing ) && (
						<ReusableBlockEditPanel
							isEditing={ isEditing }
							isEditDisabled={ ! canUpdateBlock }
							onEdit={ this.startEditing }
							onSave={ this.stopEditing }
							onCancel={ this.cancelEditing }
						/>
					) }
					{ ! isSelected && ! isEditing && (
						<ReusableBlockIndicator title={ reusableBlock.title } />
					) }
					{ list }
				</EditorProvider>
			</SlotFillProvider>
		);
	}
}

export default compose( [
	withRegistry,
	withSelect( ( select, ownProps ) => {
		const { clientId, attributes } = ownProps;
		const { ref } = attributes;
		const { canUser, getEntityRecord } = select( 'core' );
		const { isResolving } = select( 'core/data' );
		const { getEditorSettings } = select( 'core/editor' );
		const { isBlockSelected } = select( 'core/block-editor' );

		const isTemporaryReusableBlock = ! Number.isFinite( ref );

		let reusableBlock;
		if ( ! isTemporaryReusableBlock ) {
			reusableBlock = getEntityRecord( 'postType', 'wp_block', ref );
		}

		return {
			reusableBlock,
			isSelected: isBlockSelected( clientId ),
			isFetching: isResolving(
				'core',
				'getEntityRecord',
				[ 'postType', 'wp_block', ref ]
			),
			canUpdateBlock: (
				!! reusableBlock &&
				! isTemporaryReusableBlock &&
				!! canUser( 'update', 'blocks', ref )
			),
			settings: getEditorSettings(),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { selectBlock } = dispatch( 'core/block-editor' );

		return {
			selectBlock() {
				selectBlock( ownProps.clientId );
			},
		};
	} ),
] )( ReusableBlockEdit );
