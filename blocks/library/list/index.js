/**
 * WordPress dependencies
 */
import { switchChildrenNodeName } from 'element';
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq, createBlock } from '../../api';
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
	const list = find( parents, ( node ) => node.nodeName === 'UL' || node.nodeName === 'OL' );
	return list ? list.nodeName : null;
}

registerBlock( 'core/list', {
	title: wp.i18n.__( 'List' ),
	icon: 'editor-ul',
	category: 'common',

	attributes: {
		nodeName: prop( 'ol,ul', 'nodeName' ),
		values: children( 'ol,ul' ),
	},

	controls: [
		{
			icon: 'editor-ul',
			title: wp.i18n.__( 'Convert to unordered' ),
			isActive: listIsActive( 'UL' ),
			onClick: listSetType( 'UL', 'InsertUnorderedList' ),
		},
		{
			icon: 'editor-ol',
			title: wp.i18n.__( 'Convert to ordered' ),
			isActive: listIsActive( 'OL' ),
			onClick: listSetType( 'OL', 'InsertOrderedList' ),
		},
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

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'ul',
						values: switchChildrenNodeName( content, 'li' ),
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { values } ) => {
					return createBlock( 'core/text', {
						content: switchChildrenNodeName( values, 'p' ),
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName = 'OL', values = [] } = attributes;
		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				getSettings={ ( settings ) => ( {
					...settings,
					plugins: ( settings.plugins || [] ).concat( 'lists' ),
					lists_indent_on_tab: false,
				} ) }
				onSetup={ ( editor ) => {
					editor.on( 'nodeChange', ( nodeInfo ) => {
						setAttributes( { internalListType: findInternalListType( nodeInfo ) } );
					} );
					setAttributes( { editor } );
				}	}
				onChange={ ( nextValues ) => {
					setAttributes( { values: nextValues } );
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
	},
} );
