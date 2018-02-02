/**
 * External dependencies
 */
import { bindActionCreators } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import { flow, pick, noop } from 'lodash';

/**
 * WordPress Dependencies
 */
import { createElement, Component } from '@wordpress/element';
import { RichTextProvider } from '@wordpress/blocks';
import {
	APIProvider,
	DropZoneProvider,
	SlotFillProvider,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { setupEditor, undo, initializeMetaBoxState } from '../../store/actions';
import store from '../../store';

/**
 * The default editor settings
 * You can override any default settings when calling initializeEditor
 *
 *  alignWide   boolean   Enable/Disable Wide/Full Alignments
 *
 * @var {Object} DEFAULT_SETTINGS
 */
const DEFAULT_SETTINGS = {
	alignWide: false,
	colors: [
		'#f78da7',
		'#cf2e2e',
		'#ff6900',
		'#fcb900',
		'#7bdcb5',
		'#00d084',
		'#8ed1fc',
		'#0693e3',
		'#eee',
		'#abb8c3',
		'#313131',
	],

	// This is current max width of the block inner area
	// It's used to constraint image resizing and this value could be overriden later by themes
	maxWidth: 608,

	// Allowed block types for the editor, defaulting to true (all supported).
	blockTypes: true,
};

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		this.store = store;
		this.initializeMetaBoxes = this.initializeMetaBoxes.bind( this );

		this.settings = {
			...DEFAULT_SETTINGS,
			...props.settings,
		};

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( ! props.recovery ) {
			this.store.dispatch( setupEditor( props.post, this.settings ) );
		}
	}

	getChildContext() {
		return {
			editor: this.settings,
		};
	}

	componentWillReceiveProps( nextProps ) {
		if (
			nextProps.settings !== this.props.settings
		) {
			// eslint-disable-next-line no-console
			console.error( 'The Editor Provider Props are immutable.' );
		}
	}

	initializeMetaBoxes( metaBoxes ) {
		this.store.dispatch( initializeMetaBoxState( metaBoxes ) );
	}

	render() {
		const { children } = this.props;
		const providers = [
			// Redux provider:
			//
			//  - context.store
			[
				ReduxProvider,
				{ store: this.store },
			],

			// RichText provider:
			//
			//  - context.onUndo
			[
				RichTextProvider,
				bindActionCreators( {
					onUndo: undo,
				}, this.store.dispatch ),
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

EditorProvider.childContextTypes = {
	editor: noop,
};

export default EditorProvider;
