/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, prop } = hpq;

function activeEditorExecCommand( command ) {
	return () => {
		const ed = tinymce.activeEditor;
		if ( ed ) {
			ed.execCommand( command );
		}
	};
}

function listIsActive( listType ) {
	return ( { nodeName = 'OL', internalListType } ) => {
		return listType === ( internalListType ? internalListType : nodeName );
	};
}

function listSetType( listType, editorCommand ) {
	return ( { internalListType }, setAttributes ) => {
		if ( internalListType ) {
			// only change list types, don't toggle off internal lists
			if ( internalListType !== listType )	{
				activeEditorExecCommand( editorCommand )();
			}
		} else {
			setAttributes( { nodeName: listType } );
		}
	};
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
			onClick: activeEditorExecCommand( 'Outdent' )
		},
		{
			icon: 'editor-indent',
			title: wp.i18n.__( 'Indent list item' ),
			isActive: () => false,
			onClick: activeEditorExecCommand( 'Indent' )
		},
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const onNodeChange = ( { parents } ) => {
			const list = parents.find( ( node ) => node.nodeName === 'UL' || node.nodeName === 'OL' );
			const internalListType = list ? list.nodeName : null;
			setAttributes( { internalListType } );
		};
		const { nodeName = 'OL', values = [] } = attributes;
		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				onChange={ ( nextValues ) => {
					setAttributes( { values: nextValues } );
				} }
				value={ values }
				focus={ focus }
				onFocus={ setFocus }
				onNodeChange={ onNodeChange }
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
