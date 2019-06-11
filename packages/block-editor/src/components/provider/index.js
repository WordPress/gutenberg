/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';

class BlockEditorProvider extends Component {
	constructor() {
		super( ...arguments );
		this.lastPersistedBlocks = [];
	}
	componentDidMount() {
		this.props.updateSettings( this.props.settings );
		this.props.resetBlocks( this.props.value );
		this.attachChangeObserver( this.props.registry );
	}

	componentDidUpdate( prevProps ) {
		const {
			settings,
			updateSettings,
			value,
			resetBlocks,
			registry,
		} = this.props;

		if ( settings !== prevProps.settings ) {
			updateSettings( settings );
		}

		if ( registry !== prevProps.registry ) {
			this.attachChangeObserver( registry );
		}

		if ( value !== prevProps.value && this.lastPersistedBlocks.indexOf( value ) === -1 ) {
			this.isSyncingIncomingValue = true;
			resetBlocks( value );
			this.lastPersistedBlocks = [];
		}

		// Reset the last persisted values once the last change is performed
		if ( value === this.lastPersistedBlocks[ 0 ] ) {
			this.lastPersistedBlocks = [];
		}
	}

	componentWillUnmount() {
		if ( this.unsubscribe ) {
			this.unsubscribe();
		}
	}

	/**
	 * Given a registry object, overrides the default dispatch behavior for the
	 * `core/block-editor` store to interpret a state change and decide whether
	 * we should call `onChange` or `onInput` depending on whether the change
	 * is persistent or not.
	 *
	 * This needs to be done synchronously after state changes (instead of using
	 * `componentDidUpdate`) in order to avoid batching these changes.
	 *
	 * @param {WPDataRegistry} registry     Registry from which block editor
	 *                                      dispatch is to be overriden.
	 */
	attachChangeObserver( registry ) {
		if ( this.unsubscribe ) {
			this.unsubscribe();
		}

		const {
			getBlocks,
			isLastBlockChangePersistent,
			getLastBlockAttributesChange,
			__unstableIsLastBlockChangeIgnored,
		} = registry.select( 'core/block-editor' );

		let blocks = getBlocks();
		let isPersistent = isLastBlockChangePersistent();

		this.unsubscribe = registry.subscribe( () => {
			const {
				onChange,
				onInput,
			} = this.props;
			const newBlocks = getBlocks();
			const newIsPersistent = isLastBlockChangePersistent();
			if (
				newBlocks !== blocks && (
					this.isSyncingIncomingValue ||
					__unstableIsLastBlockChangeIgnored()
				)
			) {
				this.isSyncingIncomingValue = false;
				blocks = newBlocks;
				isPersistent = newIsPersistent;
				return;
			}

			if (
				newBlocks !== blocks ||
				// This happens when a previous input is explicitely marked as persistent.
				( newIsPersistent && ! isPersistent )
			) {
				blocks = newBlocks;
				isPersistent = newIsPersistent;
				const lastChanges = getLastBlockAttributesChange();
				this.lastPersistedBlocks.push( blocks );

				if ( isPersistent ) {
					onChange( blocks, lastChanges );
				} else {
					onInput( blocks, lastChanges );
				}
			}
		} );
	}

	render() {
		const { children } = this.props;

		return children;
	}
}

export default compose( [
	withRegistryProvider,
	withDispatch( ( dispatch ) => {
		const {
			updateSettings,
			resetBlocks,
		} = dispatch( 'core/block-editor' );

		return {
			updateSettings,
			resetBlocks,
		};
	} ),
] )( BlockEditorProvider );
