/**
 * External dependencies
 */
import { flow, pick } from 'lodash';
import memoize from 'memize';

/**
 * WordPress Dependencies
 */
import { createElement, Component, compose } from '@wordpress/element';
import {
	APIProvider,
	DropZoneProvider,
	SlotFillProvider,
} from '@wordpress/components';
import { withDispatch, withCustomReducerKey } from '@wordpress/data';
import createEditorStore from '../../store';

/**
 * Internal dependencies
 */
import RichTextProvider from '../rich-text/provider';

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( ! props.recovery ) {
			this.props.updateEditorSettings( props.settings );
			this.props.setupEditor( props.post, props.settings.autosave );
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.settings !== prevProps.settings ) {
			this.props.updateEditorSettings( this.props.settings );
		}
	}

	render() {
		const {
			children,
			undo,
			redo,
			createUndoLevel,
			inheritContext,
		} = this.props;

		if ( inheritContext ) {
			return children;
		}

		const providers = [
			// RichText provider:
			//
			//  - context.onUndo
			//  - context.onRedo
			//  - context.onCreateUndoLevel
			[
				RichTextProvider,
				{
					onUndo: undo,
					onRedo: redo,
					onCreateUndoLevel: createUndoLevel,
				},
			],

			// Slot / Fill provider:
			//
			//  - context.getSlot
			//  - context.registerSlot
			//  - context.unregisterSlot
			[
				SlotFillProvider,
			],

			// APIProvider
			//
			//  - context.getAPISchema
			//  - context.getAPIPostTypeRestBaseMapping
			//  - context.getAPITaxonomyRestBaseMapping
			[
				APIProvider,
				{
					...wpApiSettings,
					...pick( wp.api, [
						'postTypeRestBaseMapping',
						'taxonomyRestBaseMapping',
					] ),
				},
			],

			// DropZone provider:
			[
				DropZoneProvider,
			],
		];

		const createEditorElement = flow(
			providers.map( ( [ Provider, props ] ) => (
				( arg ) => createElement( Provider, props, arg )
			) )
		);

		return createEditorElement( children );
	}
}

const createStoreOnce = memoize( ( reducerKey ) => createEditorStore( reducerKey ) );

export default compose( [
	( WrappedComponent ) => class extends Component {
		constructor( props ) {
			super( ...arguments );

			createStoreOnce( props.reducerKey );
		}

		componentDidMount() {
			if ( this.props.onStoreCreated ) {
				this.props.onStoreCreated();
			}
		}

		render() {
			return <WrappedComponent { ...this.props } />;
		}
	},
	withCustomReducerKey( ( reducerKey, ownProps ) => {
		if ( reducerKey === 'core/editor' && ownProps.reducerKey ) {
			return ownProps.reducerKey;
		}

		return reducerKey;
	} ),
	withDispatch( ( dispatch ) => {
		const {
			setupEditor,
			updateEditorSettings,
			undo,
			redo,
			createUndoLevel,
		} = dispatch( 'core/editor' );
		return {
			setupEditor,
			undo,
			redo,
			createUndoLevel,
			updateEditorSettings,
		};
	} ),
] )( EditorProvider );
