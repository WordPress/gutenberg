/**
 * External dependencies
 */
import { flow, map } from 'lodash';

/**
 * WordPress Dependencies
 */
import { compose } from '@wordpress/compose';
import { createElement, Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { traverse, wrap, urlRewrite, editorWidth } from '../../editor-styles';

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( ! props.recovery ) {
			this.props.updateEditorSettings( props.settings );
			this.props.updatePostLock( props.settings.postLock );
			this.props.setupEditor( props.post, props.settings.autosave );
		}
	}

	componentDidMount() {
		if ( ! this.props.settings.styles ) {
			return;
		}

		map( this.props.settings.styles, ( { css, baseURL } ) => {
			const transforms = [
				editorWidth,
				wrap( '.editor-block-list__block', [ '.wp-block' ] ),
			];
			if ( baseURL ) {
				transforms.push( urlRewrite( baseURL ) );
			}
			const updatedCSS = traverse( css, compose( transforms ) );
			if ( updatedCSS ) {
				const node = document.createElement( 'style' );
				node.innerHTML = updatedCSS;
				document.body.appendChild( node );
			}
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
		} = this.props;

		const providers = [
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
		updatePostLock,
	} = dispatch( 'core/editor' );
	return {
		setupEditor,
		updateEditorSettings,
		updatePostLock,
	};
} )( EditorProvider );
