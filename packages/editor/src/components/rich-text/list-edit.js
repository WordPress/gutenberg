/**
 * WordPress dependencies
 */

import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	LINE_SEPARATOR,
	slice,
	normaliseFormats,
	applyLineFormat,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */

import { RichTextShortcut } from './shortcut';
import BlockFormatControls from '../block-format-controls';

function isListRootSelected( editor ) {
	return (
		! editor.selection ||
		editor.selection.getNode().closest( 'ol,ul' ) === editor.getBody()
	);
}

function isActiveListType( editor, tagName, rootTagName ) {
	if ( document.activeElement !== editor.getBody() ) {
		return tagName === rootTagName;
	}

	const listItem = editor.selection.getNode();
	const list = listItem.closest( 'ol,ul' );

	if ( ! list ) {
		return;
	}

	return list.nodeName.toLowerCase() === tagName;
}

function getLineIndex( value ) {
	const beforeValue = slice( value, 0, value.start );
	return beforeValue.text.lastIndexOf( LINE_SEPARATOR );
}

function outdentLineFormat( value ) {
	const index = getLineIndex( value );
	const { text, formats, start, end } = value;
	const newFormats = formats.slice( 0 );

	if ( ! newFormats[ index ] ) {
		return value;
	}

	newFormats[ index ].pop();

	if ( newFormats[ index ].length === 0 ) {
		delete newFormats[ index ];
	}

	return normaliseFormats( {
		text,
		formats: newFormats,
		start,
		end,
	} );
}

export const ListEdit = ( {
	editor,
	onTagNameChange,
	tagName,
	onSyncDOM,
	value,
	onChange,
} ) => (
	<Fragment>
		<RichTextShortcut
			type="primary"
			character="["
			onUse={ () => {
				editor.execCommand( 'Outdent' );
				onSyncDOM();
			} }
		/>
		<RichTextShortcut
			type="primary"
			character="]"
			onUse={ () => {
				editor.execCommand( 'Indent' );
				onSyncDOM();
			} }
		/>
		<RichTextShortcut
			type="primary"
			character="m"
			onUse={ () => {
				editor.execCommand( 'Indent' );
				onSyncDOM();
			} }
		/>
		<RichTextShortcut
			type="primaryShift"
			character="m"
			onUse={ () => {
				editor.execCommand( 'Outdent' );
				onSyncDOM();
			} }
		/>
		<BlockFormatControls>
			<Toolbar
				controls={ [
					onTagNameChange && {
						icon: 'editor-ul',
						title: __( 'Convert to unordered list' ),
						isActive: isActiveListType( editor, 'ul', tagName ),
						onClick() {
							if ( isListRootSelected( editor ) ) {
								onTagNameChange( 'ul' );
							} else {
								editor.execCommand( 'InsertUnorderedList' );
								onSyncDOM();
							}
						},
					},
					onTagNameChange && {
						icon: 'editor-ol',
						title: __( 'Convert to ordered list' ),
						isActive: isActiveListType( editor, 'ol', tagName ),
						onClick() {
							if ( isListRootSelected( editor ) ) {
								onTagNameChange( 'ol' );
							} else {
								editor.execCommand( 'InsertOrderedList' );
								onSyncDOM();
							}
						},
					},
					{
						icon: 'editor-outdent',
						title: __( 'Outdent list item' ),
						onClick: () => {
							onChange( outdentLineFormat( value ) );
						},
					},
					{
						icon: 'editor-indent',
						title: __( 'Indent list item' ),
						onClick: () => {
							onChange( applyLineFormat( value, { type: 'ul' }, { type: tagName } ) );
						},
					},
				].filter( Boolean ) }
			/>
		</BlockFormatControls>
	</Fragment>
);
