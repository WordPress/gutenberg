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
import { traverse, wrap, urlRewrite, editorWidth } from '../../editor-styles';
import RichTextProvider from '../rich-text/provider';

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		// Assume that we don't need to initialize in the case of an error
		// recovery.
		//
		// TODO: Check to see whether we would ever expect constructor to be
		// called even in case of recovery. In recovery, wouldn't the same
		// Provider be reused? Suspected dead code.
		if ( props.recovery ) {
			return;
		}

		props.updateEditorSettings( props.settings );
		props.resetPost( props.post );

		const isNewPost = props.post.status === 'auto-draft';
		if ( isNewPost ) {
			props.synchronizeTemplate();
		}

		const { autosave } = props.settings;
		if ( autosave ) {
			const noticeMessage = __( 'There is an autosave of this post that is more recent than the version below.' );
			props.createWarningNotice(
				<p>
					{ noticeMessage }
					{ ' ' }
					<a href={ autosave.editLink }>{ __( 'View the autosave' ) }</a>
				</p>,
				{
					id: 'autosave-exists',
					spokenMessage: noticeMessage,
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
		resetPost,
		createWarningNotice,
		updateEditorSettings,
		undo,
		redo,
		createUndoLevel,
		synchronizeTemplate,
	} = dispatch( 'core/editor' );
	return {
		resetPost,
		createWarningNotice,
		undo,
		redo,
		createUndoLevel,
		updateEditorSettings,
		synchronizeTemplate,
	};
} )( EditorProvider );
