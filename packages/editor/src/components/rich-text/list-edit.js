/**
 * WordPress dependencies
 */

import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	indentListItems,
	outdentListItems,
	changeListType,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */

import { RichTextShortcut } from './shortcut';
import BlockFormatControls from '../block-format-controls';

function isListRootSelected() {
	const selection = window.getSelection();

	if ( selection.rangeCount === 0 ) {
		return true;
	}

	let { startContainer } = selection.getRangeAt( 0 );

	if ( startContainer.nodeType === window.Node.TEXT_NODE ) {
		startContainer = startContainer.parentNode;
	}

	const rootNode = startContainer.closest( '*[contenteditable]' );

	if ( ! rootNode || ! rootNode.contains( startContainer ) ) {
		return true;
	}

	return startContainer.closest( 'ol,ul' ) === rootNode;
}

function isActiveListType( tagName, rootTagName ) {
	const selection = window.getSelection();

	if ( selection.rangeCount === 0 ) {
		return tagName === rootTagName;
	}

	let { startContainer } = selection.getRangeAt( 0 );

	if ( startContainer.nodeType === window.Node.TEXT_NODE ) {
		startContainer = startContainer.parentNode;
	}

	const rootNode = startContainer.closest( '*[contenteditable]' );

	if ( ! rootNode || ! rootNode.contains( startContainer ) ) {
		return tagName === rootTagName;
	}

	const list = startContainer.closest( 'ol,ul' );

	if ( ! list ) {
		return;
	}

	return list.nodeName.toLowerCase() === tagName;
}

export const ListEdit = ( {
	onTagNameChange,
	tagName,
	value,
	onChange,
} ) => (
	<Fragment>
		<RichTextShortcut
			type="primary"
			character="["
			onUse={ () => {
				onChange( outdentListItems( value ) );
			} }
		/>
		<RichTextShortcut
			type="primary"
			character="]"
			onUse={ () => {
				onChange( indentListItems( value, { type: tagName } ) );
			} }
		/>
		<RichTextShortcut
			type="primary"
			character="m"
			onUse={ () => {
				onChange( indentListItems( value, { type: tagName } ) );
			} }
		/>
		<RichTextShortcut
			type="primaryShift"
			character="m"
			onUse={ () => {
				onChange( outdentListItems( value ) );
			} }
		/>
		<BlockFormatControls>
			<Toolbar
				controls={ [
					onTagNameChange && {
						icon: 'editor-ul',
						title: __( 'Convert to unordered list' ),
						isActive: isActiveListType( 'ul', tagName ),
						onClick() {
							onChange( changeListType( value, { type: 'ul' } ) );

							if ( isListRootSelected() ) {
								onTagNameChange( 'ul' );
							}
						},
					},
					onTagNameChange && {
						icon: 'editor-ol',
						title: __( 'Convert to ordered list' ),
						isActive: isActiveListType( 'ol', tagName ),
						onClick() {
							onChange( changeListType( value, { type: 'ol' } ) );

							if ( isListRootSelected() ) {
								onTagNameChange( 'ol' );
							}
						},
					},
					{
						icon: 'editor-outdent',
						title: __( 'Outdent list item' ),
						onClick: () => {
							onChange( outdentListItems( value ) );
						},
					},
					{
						icon: 'editor-indent',
						title: __( 'Indent list item' ),
						onClick: () => {
							onChange( indentListItems( value, { type: tagName } ) );
						},
					},
				].filter( Boolean ) }
			/>
		</BlockFormatControls>
	</Fragment>
);
