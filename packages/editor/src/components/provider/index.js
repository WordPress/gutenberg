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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { traverse, wrap, urlRewrite } from '../../editor-styles';

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( props.recovery ) {
			return;
		}

		props.updateEditorSettings( props.settings );
		props.updatePostLock( props.settings.postLock );
		props.setupEditor( props.post, props.initialEdits );

		if ( props.settings.autosave ) {
			props.createWarningNotice(
				__( 'There is an autosave of this post that is more recent than the version below.' ),
				{
					id: 'autosave-exists',
					actions: [
						{
							label: __( 'View the autosave' ),
							url: props.settings.autosave.editLink,
						},
					],
				}
			);
		}
	}

	componentDidMount() {
		if ( ! this.props.settings.styles ) {
			return;
		}

		map( this.props.settings.styles, ( { css, baseURL } ) => {
			const transforms = [
				wrap( '.editor-styles-wrapper' ),
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
	const { createWarningNotice } = dispatch( 'core/notices' );

	return {
		setupEditor,
		updateEditorSettings,
		updatePostLock,
		createWarningNotice,
	};
} )( EditorProvider );
