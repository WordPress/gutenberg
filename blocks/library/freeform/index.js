/**
 * WordPress dependencies
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query, setUnknownTypeHandler } from '../../api';
import Editable from '../../editable';

const { children } = query;

function execCommand( command ) {
	return ( { editor } ) => {
		if ( editor ) {
			editor.execCommand( command );
		}
	};
}

function blockQuoteIsActive() {
	return ( { inBlockQuote } ) => {
		return inBlockQuote;
	};
}

function listIsActive( expectedListType ) {
	return ( { listType } ) => {
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

function internalValue( defaultValue ) {
	const thunk = () => defaultValue;
	thunk._wpBlocksKnownMatcher = true;
	return thunk;
}

registerBlock( 'core/freeform', {
	title: wp.i18n.__( 'Freeform' ),

	icon: 'text',

	category: 'common',

	attributes: {
		content: children(),
		listType: internalValue( null ),
		inBlockQuote: internalValue( false ),
		editor: internalValue( null ),
	},

	defaultAttributes: {
		content: <p />,
		listType: null,
		inBlockQuote: false,
		editor: null,
	},

	controls: [
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
	],

	advControls: [
		{
			icon: 'editor-outdent',
			title: wp.i18n.__( 'Outdent list item' ),
			onClick: execCommand( 'Outdent' ),
		},
		{
			icon: 'editor-indent',
			title: wp.i18n.__( 'Indent list item' ),
			onClick: execCommand( 'Indent' ),
		},
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { content } = attributes;

		return (
			<Editable
				className="blocks-freeform"
				value={ content }
				getSettings={ ( settings ) => ( {
					...settings,
					plugins: ( settings.plugins || [] ).concat( 'lists' ),
				} ) }
				onSetup={ ( editor ) => {
					editor.on( 'nodeChange', ( nodeInfo ) => {
						setAttributes( {
							listType: findListType( nodeInfo ),
							inBlockQuote: findInBlockQuote( nodeInfo ),
						} );
					} );
					setAttributes( { editor } );
				} }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				showAlignments
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;
		return content;
	},
} );

setUnknownTypeHandler( 'core/freeform' );
