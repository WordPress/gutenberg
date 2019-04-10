/**
 * WordPress dependencies
 */

import { Toolbar } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	__unstableIndentListItems as indentListItems,
	__unstableOutdentListItems as outdentListItems,
	__unstableChangeListType as changeListType,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */

import { RichTextShortcut } from './shortcut';
import BlockFormatControls from '../block-format-controls';

const { TEXT_NODE, ELEMENT_NODE } = window.Node;

/**
 * Gets the selected list node, which is the closest list node to the start of
 * the selection.
 *
 * @return {?Element} The selected list node, or undefined if none is selected.
 */
function getSelectedListNode() {
	const selection = window.getSelection();

	if ( selection.rangeCount === 0 ) {
		return;
	}

	let { startContainer } = selection.getRangeAt( 0 );

	if ( startContainer.nodeType === TEXT_NODE ) {
		startContainer = startContainer.parentNode;
	}

	if ( startContainer.nodeType !== ELEMENT_NODE ) {
		return;
	}

	const rootNode = startContainer.closest( '*[contenteditable]' );

	if ( ! rootNode || ! rootNode.contains( startContainer ) ) {
		return;
	}

	return startContainer.closest( 'ol,ul' );
}

/**
 * Whether or not the root list is selected.
 *
 * @return {boolean} True if the root list or nothing is selected, false if an
 *                   inner list is selected.
 */
function isListRootSelected() {
	const listNode = getSelectedListNode();

	// Consider the root list selected if nothing is selected.
	return ! listNode || listNode.contentEditable === 'true';
}

/**
 * Wether or not the selected list has the given tag name.
 *
 * @param {string}  tagName     The tag name the list should have.
 * @param {string}  rootTagName The current root tag name, to compare with in
 *                              case nothing is selected.
 *
 * @return {boolean}             [description]
 */
function isActiveListType( tagName, rootTagName ) {
	const listNode = getSelectedListNode();

	if ( ! listNode ) {
		return tagName === rootTagName;
	}

	return listNode.nodeName.toLowerCase() === tagName;
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
						shortcut: _x( 'Backspace', 'keyboard key' ),
						onClick: () => {
							onChange( outdentListItems( value ) );
						},
					},
					{
						icon: 'editor-indent',
						title: __( 'Indent list item' ),
						shortcut: _x( 'Space', 'keyboard key' ),
						onClick: () => {
							onChange( indentListItems( value, { type: tagName } ) );
						},
					},
				].filter( Boolean ) }
			/>
		</BlockFormatControls>
	</Fragment>
);
