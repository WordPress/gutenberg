/**
 * External dependencies
 */
import { flow, map } from 'lodash';
import postcss from 'postcss';
import wrap from 'postcss-prefixwrap';

/**
 * WordPress Dependencies
 */
import urlReplace from '@wordpress/postcss-url';
import { createElement, Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

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

	componentDidMount() {
		if ( ! this.props.settings.styles ) {
			return;
		}

		map( this.props.settings.styles, ( { css, baseURL } ) => {
			const transforms = [ wrap( '.editor-block-list__block' ) ];
			if ( baseURL ) {
				transforms.push( urlReplace( { baseURL } ) );
			}
			postcss( transforms )
				.process( css )
				.then( ( output ) => {
					const node = document.createElement( 'style' );
					node.innerHTML = output;
					document.body.appendChild( node );
				} );
		} );
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
		} = this.props;

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
} )( EditorProvider );
