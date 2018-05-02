/**
 * External dependencies
 */
import { flow, pick } from 'lodash';

/**
 * WordPress Dependencies
 */
import { createElement, Component } from '@wordpress/element';
import { RichTextProvider, EditorSettings } from '@wordpress/blocks';
import {
	APIProvider,
	DropZoneProvider,
	SlotFillProvider,
} from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( ! props.recovery ) {
			this.props.setupEditor( props.post, {
				...EditorSettings.defaultSettings,
				...this.props.settings,
			} );
		}
	}

	render() {
		const {
			children,
			settings,
			undo,
			redo,
			createUndoLevel,
		} = this.props;

		const providers = [
			// Editor settings provider
			[
				EditorSettings.Provider,
				{
					value: {
						...EditorSettings.defaultSettings,
						...settings,
					},
				},
			],

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

export default withDispatch( ( dispatch ) => {
	const {
		setupEditor,
		undo,
		redo,
		createUndoLevel,
	} = dispatch( 'core/editor' );
	return {
		setupEditor,
		undo,
		redo,
		createUndoLevel,
	};
} )( EditorProvider );
