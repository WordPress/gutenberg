/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	RichText,
	BlockControls,
	RichTextShortcut,
} from '@wordpress/block-editor';
import {
	Toolbar,
} from '@wordpress/components';
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
import { name } from './';
import OrderedListSettings from './ordered-list-settings';

export default function ListEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	className,
} ) {
	const { ordered, values, reversed, start } = attributes;
	const tagName = ordered ? 'ol' : 'ul';

	const controls = ( { value, onChange } ) => {
		if ( value.start === undefined ) {
			return;
		}

		return <>
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
			<BlockControls>
				<Toolbar
					controls={ [
						{
							icon: 'editor-ul',
							title: __( 'Convert to unordered list' ),
							isActive: isActiveListType( value, 'ul', tagName ),
							onClick() {
								onChange( changeListType( value, { type: 'ul' } ) );

								if ( isListRootSelected( value ) ) {
									setAttributes( { ordered: false } );
								}
							},
						},
						{
							icon: 'editor-ol',
							title: __( 'Convert to ordered list' ),
							isActive: isActiveListType( value, 'ol', tagName ),
							onClick() {
								onChange( changeListType( value, { type: 'ol' } ) );

								if ( isListRootSelected( value ) ) {
									setAttributes( { ordered: true } );
								}
							},
						},
						{
							icon: 'editor-outdent',
							title: __( 'Outdent list item' ),
							shortcut: _x( 'Backspace', 'keyboard key' ),
							onClick() {
								onChange( outdentListItems( value ) );
							},
						},
						{
							icon: 'editor-indent',
							title: __( 'Indent list item' ),
							shortcut: _x( 'Space', 'keyboard key' ),
							onClick() {
								onChange( indentListItems( value, { type: tagName } ) );
							},
						},
					] }
				/>
			</BlockControls>
		</>;
	};

	return <>
		<RichText
			identifier="values"
			multiline="li"
			tagName={ tagName }
			onChange={ ( nextValues ) => setAttributes( { values: nextValues } ) }
			value={ values }
			className={ className }
			placeholder={ __( 'Write list…' ) }
			onMerge={ mergeBlocks }
			onSplit={ ( value ) => createBlock( name, { ordered, values: value } ) }
			__unstableOnSplitMiddle={ () => createBlock( 'core/paragraph' ) }
			onReplace={ onReplace }
			onRemove={ () => onReplace( [] ) }
			start={ start }
			reversed={ reversed }
		>
			{ controls }
		</RichText>
		{ ordered && (
			<OrderedListSettings
				setAttributes={ setAttributes }
				ordered={ ordered }
				reversed={ reversed }
				start={ start }
			/> ) }
	</>;
}
