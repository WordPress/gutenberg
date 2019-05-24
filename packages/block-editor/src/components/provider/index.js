/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';

class BlockEditorProvider extends Component {
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

		if ( this.isSyncingOutcomingValue ) {
			this.isSyncingOutcomingValue = false;
		} else if ( value !== prevProps.value ) {
			this.isSyncingIncomingValue = true;
			resetBlocks( value );
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
				// When knowing the blocks value is changing, assign instance
				// value to skip reset in subsequent `componentDidUpdate`.
				if ( newBlocks !== blocks ) {
					this.isSyncingOutcomingValue = true;
				}

				blocks = newBlocks;
				isPersistent = newIsPersistent;

				if ( isPersistent ) {
					onChange( blocks );
				} else {
					onInput( blocks );
				}
			}
		} );
	}

	render() {
		const { children } = this.props;

		return (
			<SlotFillProvider>
				<DropZoneProvider>
					{ children }
				</DropZoneProvider>
			</SlotFillProvider>
		);
	}
}

export default compose( [
	withRegistryProvider,
	withDispatch( ( dispatch ) => {
		const {
			updateSettings,
			resetBlocks,
		} = dispatch( 'core/block-editor' );

		const {
			getEditorSettings,
		} = dispatch( 'core/editor' );

		return {
			updateSettings,
			resetBlocks,
			getEditorSettings,
		};
	} ),
] )( BlockEditorProvider );
