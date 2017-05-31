/**
 * WordPress dependencies
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import Editable from '../../editable';
import BlockControls from '../../block-controls';

function addPluginToSettings( plugin ) {
	return ( settings ) => ( {
		...settings,
		plugins: ( settings.plugins || [] ).concat( plugin ),
	} );
}

function execCommand( command ) {
	return ( editor ) => {
		if ( editor ) {
			editor.execCommand( command );
		}
	};
}

function blockQuoteIsActive() {
	return ( props, state ) => {
		const { inBlockQuote } = state;
		return inBlockQuote;
	};
}

function listIsActive( expectedListType ) {
	return ( props, state ) => {
		const { listType } = state;
		return expectedListType === listType;
	};
}

function findListType( { parents } ) {
	const list = find( parents, ( node ) => node.nodeName === 'UL' || node.nodeName === 'OL' );
	return list ? list.nodeName : null;
}

function findInBlockQuote( { parents } ) {
	const quote = find( parents, ( node ) => node.nodeName === 'BLOCKQUOTE' );
	return ! ! quote;
}

const FREEFORM_CONTROLS = [
	{
		icon: 'editor-quote',
		title: wp.i18n.__( 'Quote' ),
		isActive: blockQuoteIsActive(),
		onClick: execCommand( 'mceBlockQuote' ),
	},
	{
		icon: 'editor-ul',
		title: wp.i18n.__( 'Convert to unordered' ),
		isActive: listIsActive( 'UL' ),
		onClick: execCommand( 'InsertUnorderedList' ),
	},
	{
		icon: 'editor-ol',
		title: wp.i18n.__( 'Convert to ordered' ),
		isActive: listIsActive( 'OL' ),
		onClick: execCommand( 'InsertOrderedList' ),
	},
];

export default class FreeformBlock extends wp.element.Component {
	constructor() {
		super();
		this.state = {
			editor: null,
		};
		this.setEditor = this.setEditor.bind( this );
		this.controls = this.controls.bind( this );
	}

	setEditor( editor ) {
		editor.on( 'nodeChange', ( nodeInfo ) => {
			this.setState( {
				listType: findListType( nodeInfo ),
				inBlockQuote: findInBlockQuote( nodeInfo ),
			} );
		} );
		this.setState( { editor } );
	}

	controls() {
		return FREEFORM_CONTROLS.map( ( control ) => ( {
			...control,
			onClick: () => control.onClick( this.state.editor ),
			isActive: control.isActive( this.props, this.state ),
		} ) );
	}

	render() {
		const { content, focus, onFocus, onChange } = this.props;

		return [
			focus && (
				<BlockControls
					key="controls"
					controls={ this.controls() }
				/>
			),
			<Editable
				key="editor"
				getSettings={ addPluginToSettings( 'lists' ) }
				style={ { width: '100%' } }
				onSetup={ this.setEditor }
				onChange={ onChange }
				value={ content }
				focus={ focus }
				onFocus={ onFocus }
				showAlignments
				className="blocks-freeform" />,
		];
	}
}
