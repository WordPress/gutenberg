/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withDispatch, withSelect, RegistryConsumer } from '@wordpress/data';
import { compose, createHigherOrderComponent } from '@wordpress/compose';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Higher-order component which renders the original component with the current
 * registry context passed as its `registry` prop.
 *
 * @param {WPComponent} OriginalComponent Original component.
 *
 * @return {WPComponent} Enhanced component.
 */
const withRegistry = createHigherOrderComponent(
	( OriginalComponent ) => ( props ) => (
		<RegistryConsumer>
			{ ( registry ) => (
				<OriginalComponent
					{ ...props }
					registry={ registry }
				/>
			) }
		</RegistryConsumer>
	),
	'withRegistry'
);

/**
 * Returns true if the two object arguments have the same keys, or false
 * otherwise.
 *
 * @param {Object} a First object.
 * @param {Object} b Second object.
 *
 * @return {boolean} Whether the two objects have the same keys.
 */
export function hasSameKeys( a, b ) {
	return !! a && !! b && isShallowEqual( Object.keys( a ), Object.keys( b ) );
}

/**
 * Returns true if, given the currently dispatching action and the previously
 * dispatched action, the two actions are updating the same block attribute, or
 * false otherwise.
 *
 * @param {Object} action     Currently dispatching action.
 * @param {Object} lastAction Previously dispatched action.
 *
 * @return {boolean} Whether actions are updating the same block attribute.
 */
export function isUpdatingSameBlockAttribute( action, lastAction ) {
	return (
		action.type === 'UPDATE_BLOCK_ATTRIBUTES' &&
		action.clientId === lastAction.clientId &&
		hasSameKeys( action.attributes, lastAction.attributes )
	);
}

/**
 * Given a data namespace store and a callback, returns a substitute dispatch
 * function which preserves the original dispatch behavior and invokes the
 * callback when a blocks state change should be committed.
 *
 * @param {WPDataNamespaceStore} store    Store for which to create replacement
 *                                        dispatch function.
 * @param {Function}             callback Function to call when blocks state
 *                                        should be committed.
 *
 * @return {Function} Enhanced store dispatch function.
 */
function createChangeObserver( store, callback ) {
	let lastAction, lastState, isPendingCommit;

	function dispatch( action ) {
		const result = dispatch._originalDispatch( action );
		const state = store.getState();

		if ( action.type === 'RESET_BLOCKS' ) {
			// Consider block reset as superseding any pending change commits,
			// even if destructive to pending user commits. It should rarely be
			// the case that blocks are suddenly reset while user interacts.
			isPendingCommit = false;
		} else if ( lastAction && lastState && state !== lastState ) {
			if (
				state.editor.blocks !== lastState.editor.blocks &&
				isUpdatingSameBlockAttribute( action, lastAction )
			) {
				// So long as block updates occur as operating on the same
				// attributes in the previous action, delay callback.
				isPendingCommit = true;
			} else if ( isPendingCommit ) {
				// Once any other action occurs while pending commit, release
				// the deferred callback as completed.
				callback();
				isPendingCommit = false;
			}
		}

		lastAction = action;
		lastState = state;

		return result;
	}

	dispatch._originalDispatch = store.dispatch;

	return dispatch;
}

class BlockEditorProvider extends Component {
	constructor() {
		super( ...arguments );

		this.onChange = this.onChange.bind( this );
	}

	componentDidMount() {
		this.props.updateEditorSettings( this.props.settings );
		this.props.resetBlocks( this.props.value );
		this.attachChangeObserver( this.props.registry );

		this.isSyncingBlockValue = true;
	}

	componentDidUpdate( prevProps ) {
		const {
			settings,
			updateEditorSettings,
			value,
			resetBlocks,
			blocks,
			onInput,
			registry,
		} = this.props;

		if ( settings !== prevProps.settings ) {
			updateEditorSettings( settings );
		}

		if ( registry !== prevProps.registry ) {
			this.attachChangeObserver( registry, prevProps.registry );
		}

		if ( this.isSyncingBlockValue ) {
			this.isSyncingBlockValue = false;
		} else if ( blocks !== prevProps.blocks ) {
			onInput( blocks );
			this.isSyncingBlockValue = true;
		} else if ( value !== prevProps.value ) {
			resetBlocks( value );
			this.isSyncingBlockValue = true;
		}
	}

	/**
	 * Calls the mounted instance's `onChange` prop callback with the current
	 * blocks prop value.
	 */
	onChange() {
		this.props.onChange( this.props.blocks );
	}

	/**
	 * Given a registry object, overrides the default dispatch behavior for the
	 * `core/block-editor` store to interpret a state change which should be
	 * considered as calling the mounted instance's `onChange` callback. Unlike
	 * `onInput` which is called for any change in block state, `onChange` is
	 * only called for meaningful commit interactions. If a second registry
	 * argument is passed, it is treated as the previous registry to which the
	 * dispatch behavior was overridden, and the original dispatch is restored.
	 *
	 * @param {WPDataRegistry} registry     Registry from which block editor
	 *                                      dispatch is to be overriden.
	 * @param {WPDataRegistry} prevRegistry Previous registry whose dispatch
	 *                                      behavior should be restored.
	 */
	attachChangeObserver( registry, prevRegistry ) {
		const { store } = registry.namespaces[ 'core/block-editor' ];
		store.dispatch = createChangeObserver( store, this.onChange );

		if ( prevRegistry ) {
			const { store: prevStore } = prevRegistry.namespaces[ 'core/block-editor' ];
			prevStore.dispatch = prevStore.dispatch._originalDispatch;
		}
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
	withSelect( ( select ) => {
		const { getBlocks } = select( 'core/block-editor' );

		return {
			blocks: getBlocks(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			updateEditorSettings,
			resetBlocks,
		} = dispatch( 'core/block-editor' );

		return {
			updateEditorSettings,
			resetBlocks,
		};
	} ),
	withRegistry,
] )( BlockEditorProvider );
