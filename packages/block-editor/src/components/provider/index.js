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

		if ( this.isSyncingOutcomingValue !== null && this.isSyncingOutcomingValue === value ) {
			// Skip block reset if the value matches expected outbound sync
			// triggered by this component by a preceding change detection.
			// Only skip if the value matches expectation, since a reset should
			// still occur if the value is modified (not equal by reference),
			// to allow that the consumer may apply modifications to reflect
			// back on the editor.
			this.isSyncingOutcomingValue = null;
		} else if ( value !== prevProps.value ) {
			// Reset changing value in all other cases than the sync described
			// above. Since this can be reached in an update following an out-
			// bound sync, unset the outbound value to avoid considering it in
			// subsequent renders.
			this.isSyncingOutcomingValue = null;
			this.isSyncingIncomingValue = value;
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
				this.isSyncingIncomingValue = null;
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
					this.isSyncingOutcomingValue = newBlocks;
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
