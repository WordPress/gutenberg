/**
 * External dependencies
 */
import { differenceBy, flow, map } from 'lodash';

/**
 * WordPress Dependencies
 */
import { isBlockDefinitionValid, normalizeIconObject } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { createElement, Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { traverse, wrap, urlRewrite, editorWidth } from '../../editor-styles';

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( ! props.recovery ) {
			this.applyFiltersToBlockTypes( props.blockTypes );
			this.props.updateEditorSettings( props.settings );
			this.props.updatePostLock( props.settings.postLock );
			this.props.setupEditor( props.post, props.settings.autosave );
		}
	}

	applyFiltersToBlockTypes( blockTypes ) {
		const { addBlockTypes } = this.props;

		const modifiedBlockTypes = blockTypes.map( ( blockType ) => {
			const modifiedBlockType = applyFilters( 'blocks.registerBlockType', blockType, blockType.name );

			if ( isShallowEqual( blockType, modifiedBlockType ) ) {
				return null;
			}

			modifiedBlockType.icon = normalizeIconObject( modifiedBlockType.icon );

			return modifiedBlockType;
		} )
			.filter( ( blockType ) => blockType !== null )
			.filter( isBlockDefinitionValid );

		addBlockTypes( modifiedBlockTypes );
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
		if ( this.props.blockTypes !== prevProps.blockTypes ) {
			const newBlockTypes = differenceBy( this.props.blockTypes, prevProps.blockTypes, 'name' );
			if ( newBlockTypes.length > 0 ) {
				this.applyFiltersToBlockTypes( newBlockTypes );
			}
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

export default compose(
	withSelect( ( select ) => {
		const { getBlockTypes } = select( 'core/blocks' );

		return {
			blockTypes: getBlockTypes(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { addBlockTypes } = dispatch( 'core/blocks' );
		const {
			setupEditor,
			updateEditorSettings,
			updatePostLock,
		} = dispatch( 'core/editor' );
		return {
			addBlockTypes,
			setupEditor,
			updateEditorSettings,
			updatePostLock,
		};
	} )
)( EditorProvider );
