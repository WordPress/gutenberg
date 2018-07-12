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

		this.startEditing = this.toggleEditing.bind( this, true );
		this.stopEditing = this.toggleEditing.bind( this, false );
		this.registry = defaultRegistry.clone();
		createStore( this.registry );

		const { reusableBlock, settings } = props;
		this.state = {
			isEditing: !! ( reusableBlock && reusableBlock.isTemporary ),
			settingsWithLock: { ...settings, templateLock: true },
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

	toggleEditing( isEditing ) {
		this.setState( { isEditing } );
	}

	render() {
		const { setIsSelected, reusableBlock, isSelected, isSaving } = this.props;
		const { settingsWithLock, isEditing } = this.state;

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
								onEdit={ this.startEditing }
								onFinishedEditing={ this.stopEditing }
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
		const { selectBlock } = dispatch( 'core/editor' );
		const { id } = ownProps;

		return {
			setIsSelected: () => selectBlock( id ),
		};
	} ),
] )( ReusableBlockEdit );
