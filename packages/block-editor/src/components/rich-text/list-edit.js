/**
 * WordPress dependencies
 */

import { Toolbar } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import {
	__unstableIndentListItems as indentListItems,
	__unstableOutdentListItems as outdentListItems,
	__unstableChangeListType as changeListType,
	__unstableIsListRootSelected as isListRootSelected,
	__unstableIsActiveListType as isActiveListType,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */

import { RichTextShortcut } from './shortcut';
import BlockFormatControls from '../block-format-controls';

export const ListEdit = ( {
	onTagNameChange,
	tagName,
	value,
	onChange,
} ) => (
	<>
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
						isActive: isActiveListType( value, 'ul', tagName ),
						onClick() {
							onChange( changeListType( value, { type: 'ul' } ) );

							if ( isListRootSelected( value ) ) {
								onTagNameChange( 'ul' );
							}
						},
					},
					onTagNameChange && {
						icon: 'editor-ol',
						title: __( 'Convert to ordered list' ),
						isActive: isActiveListType( value, 'ol', tagName ),
						onClick() {
							onChange( changeListType( value, { type: 'ol' } ) );

							if ( isListRootSelected( value ) ) {
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
	</>
);
