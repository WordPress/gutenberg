/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import {
	withSelect,
	withDispatch,
	defaultRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { EditorProvider, BlockList, createStore } from '@wordpress/editor';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';
import ReusableBlockIndicator from './indicator';
import ReusableBlockSelection from './selection';

class ReusableBlockEdit extends Component {
	constructor( props ) {
		super( ...arguments );

		this.startEdit = this.toggleIsEditing.bind( this, true );
		this.cancelEdit = this.toggleIsEditing.bind( this, false );
		this.saveEdit = this.saveEdit.bind( this );
		this.registry = defaultRegistry.clone();
		createStore( this.registry );

		const { reusableBlock, settings } = props;
		this.state = {
			isEditing: !! ( reusableBlock && reusableBlock.isTemporary ),
			settingsWithLock: { ...settings, templateLock: true },
			reusableBlockInstanceId: 0,
		};
	}

	static getDerivedStateFromProps( props, prevState ) {
		if ( isShallowEqual( props.settings, prevState.settings ) ) {
			return null;
		}

		return {
			settings: props.settings,
			settingsWithLock: {
				...props.settings,
				templateLock: true,
			},
		};
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.reusableBlock !== prevProps.reusableBlock ) {
			this.setState( { reusableBlockInstanceId: this.state.reusableBlockInstanceId + 1 } );
		}
	}

	toggleIsEditing( isEditing ) {
		this.setState( { isEditing } );
	}

	saveEdit() {
		this.toggleIsEditing( false );

		const {
			getEditedPostAttribute,
			getEditedPostContent,
			getBlocks,
		} = this.registry.select( 'core/editor' );

		const reusableBlock = {
			...this.props.reusableBlock,
			title: getEditedPostAttribute( 'title' ),
			content: {
				raw: getEditedPostContent(),
			},
		};

		const [ parsedBlock ] = getBlocks();

		this.props.onSave( reusableBlock, parsedBlock );
	}

	render() {
		const { setIsSelected, reusableBlock, isSelected, isSaving } = this.props;
		const { settingsWithLock, isEditing, reusableBlockInstanceId } = this.state;

		if ( ! reusableBlock ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		let list = <BlockList />;
		if ( ! isEditing ) {
			list = <Disabled>{ list }</Disabled>;
		}

		return (
			<RegistryProvider value={ this.registry }>
				<EditorProvider
					// Force a rerender when reusableBlock is updated, so that changes made
					// externally appear in the nested editor.
					key={ reusableBlockInstanceId }
					postType="wp_block"
					inheritContext
					settings={ settingsWithLock }
					post={ reusableBlock }
				>
					<ReusableBlockSelection
						isReusableBlockSelected={ isSelected }
						onBlockSelection={ setIsSelected }
					>
						{ list }
						{ ( isSelected || isEditing ) && (
							<ReusableBlockEditPanel
								isEditing={ isEditing }
								isSaving={ isSaving && ! reusableBlock.isTemporary }
								onEdit={ this.startEdit }
								onCancel={ this.cancelEdit }
								onSave={ this.saveEdit }
							/>
						) }
						{ ! isSelected && ! isEditing && <ReusableBlockIndicator /> }
					</ReusableBlockSelection>
				</EditorProvider>
			</RegistryProvider>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { ref } = ownProps.attributes;
		if ( ! Number.isFinite( ref ) ) {
			return;
		}

		const { getEntityRecord } = select( 'core' );
		return {
			reusableBlock: getEntityRecord( 'postType', 'wp_block', ref ),
			settings: select( 'core/editor' ).getEditorSettings(),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { selectBlock, receiveReusableBlocks } = dispatch( 'core/editor' );
		const { receiveEntityRecords } = dispatch( 'core' );
		return {
			setIsSelected() {
				selectBlock( ownProps.clientId );
			},
			onSave( reusableBlock, parsedBlock ) {
				// Update the editor's store when the reusable block is changed. This
				// ensures other instances of the same reusable block are updated.
				receiveReusableBlocks( [ { reusableBlock, parsedBlock } ] );
				receiveEntityRecords( 'postType', 'wp_block', reusableBlock );
			},
		};
	} ),
] )( ReusableBlockEdit );
