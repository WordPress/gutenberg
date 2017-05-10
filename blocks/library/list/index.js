/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, prop } = hpq;

function execCommand( command ) {
	return ( { editor } ) => {
		if ( editor ) {
			editor.execCommand( command );
		}
	};
}

function listIsActive( listType ) {
	return ( { nodeName = 'OL', internalListType } ) => {
		return listType === ( internalListType ? internalListType : nodeName );
	};
}

function listSetType( listType, editorCommand ) {
	return ( { internalListType, editor }, setAttributes ) => {
		if ( internalListType ) {
			// only change list types, don't toggle off internal lists
			if ( internalListType !== listType )	{
				if ( editor ) {
					editor.execCommand( editorCommand );
				}
			}
		} else {
			setAttributes( { nodeName: listType } );
		}
	};
}

function findInternalListType( { parents } ) {
	const list = parents.find( ( node ) => node.nodeName === 'UL' || node.nodeName === 'OL' );
	return list ? list.nodeName : null;
}

registerBlock( 'core/list', {
	title: wp.i18n.__( 'List' ),
	icon: 'editor-ul',
	category: 'common',

	attributes: {
		nodeName: prop( 'ol,ul', 'nodeName' ),
		values: children( 'ol,ul' )
	},

	controls: [
		{
			icon: 'editor-ul',
			title: wp.i18n.__( 'Convert to unordered' ),
			isActive: listIsActive( 'UL' ),
			onClick: listSetType( 'UL', 'InsertUnorderedList' )
		},
		{
			icon: 'editor-ol',
			title: wp.i18n.__( 'Convert to ordered' ),
			isActive: listIsActive( 'OL' ),
			onClick: listSetType( 'OL', 'InsertOrderedList' )
		},
		{
			icon: 'editor-outdent',
			title: wp.i18n.__( 'Outdent list item' ),
			isActive: () => false,
			onClick: execCommand( 'Outdent' )
		},
		{
			icon: 'editor-indent',
			title: wp.i18n.__( 'Indent list item' ),
			isActive: () => false,
			onClick: execCommand( 'Indent' )
		},
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName = 'OL', values = [] } = attributes;
		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				onSetup={ ( nextEditor ) => {
					setAttributes( { editor: nextEditor } );
				}	}
				onChange={ ( nextValues ) => {
					setAttributes( { values: nextValues } );
				} }
				onNodeChange={ ( nodeInfo ) => {
					setAttributes( { internalListType: findInternalListType( nodeInfo ) } );
				} }
				value={ values }
				focus={ focus }
				onFocus={ setFocus }
				showAlignments
				className="blocks-list" />
		);
	},

	save( { attributes } ) {
		const { nodeName = 'OL', values = [] } = attributes;

		return wp.element.createElement(
			nodeName.toLowerCase(),
			null,
			values
		);
	}
} );
