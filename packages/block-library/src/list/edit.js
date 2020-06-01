/**
 * WordPress dependencies
 */
import { __, _x, isRTL as getRTL } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	RichText,
	BlockControls,
	RichTextShortcut,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
import {
	__unstableCanIndentListItems as canIndentListItems,
	__unstableCanOutdentListItems as canOutdentListItems,
	__unstableIndentListItems as indentListItems,
	__unstableOutdentListItems as outdentListItems,
	__unstableChangeListType as changeListType,
	__unstableIsListRootSelected as isListRootSelected,
	__unstableIsActiveListType as isActiveListType,
} from '@wordpress/rich-text';
import {
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
	formatIndent,
	formatIndentRTL,
	formatOutdent,
	formatOutdentRTL,
} from '@wordpress/icons';

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
	isSelected,
} ) {
	const { ordered, values, type, reversed, start } = attributes;
	const tagName = ordered ? 'ol' : 'ul';

	const isRTL = getRTL();

	const controls = ( { value, onChange, onFocus } ) => (
		<>
			{ isSelected && (
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
							onChange(
								indentListItems( value, { type: tagName } )
							);
						} }
					/>
					<RichTextShortcut
						type="primary"
						character="m"
						onUse={ () => {
							onChange(
								indentListItems( value, { type: tagName } )
							);
						} }
					/>
					<RichTextShortcut
						type="primaryShift"
						character="m"
						onUse={ () => {
							onChange( outdentListItems( value ) );
						} }
					/>
				</>
			) }
			<BlockControls>
				<ToolbarGroup
					controls={ [
						{
							icon: isRTL
								? formatListBulletsRTL
								: formatListBullets,
							title: __( 'Convert to unordered list' ),
							isActive: isActiveListType( value, 'ul', tagName ),
							onClick() {
								onChange(
									changeListType( value, { type: 'ul' } )
								);
								onFocus();

								if ( isListRootSelected( value ) ) {
									setAttributes( { ordered: false } );
								}
							},
						},
						{
							icon: isRTL
								? formatListNumberedRTL
								: formatListNumbered,
							title: __( 'Convert to ordered list' ),
							isActive: isActiveListType( value, 'ol', tagName ),
							onClick() {
								onChange(
									changeListType( value, { type: 'ol' } )
								);
								onFocus();

								if ( isListRootSelected( value ) ) {
									setAttributes( { ordered: true } );
								}
							},
						},
						{
							icon: isRTL ? formatOutdentRTL : formatOutdent,
							title: __( 'Outdent list item' ),
							shortcut: _x( 'Backspace', 'keyboard key' ),
							isDisabled: ! canOutdentListItems( value ),
							onClick() {
								onChange( outdentListItems( value ) );
								onFocus();
							},
						},
						{
							icon: isRTL ? formatIndentRTL : formatIndent,
							title: __( 'Indent list item' ),
							shortcut: _x( 'Space', 'keyboard key' ),
							isDisabled: ! canIndentListItems( value ),
							onClick() {
								onChange(
									indentListItems( value, { type: tagName } )
								);
								onFocus();
							},
						},
					] }
				/>
			</BlockControls>
		</>
	);

	return (
		<>
			<RichText
				identifier="values"
				multiline="li"
				__unstableMultilineRootTag={ tagName }
				tagName={ Block[ tagName ] }
				onChange={ ( nextValues ) =>
					setAttributes( { values: nextValues } )
				}
				value={ values }
				placeholder={ __( 'Write list…' ) }
				onMerge={ mergeBlocks }
				onSplit={ ( value ) =>
					createBlock( name, { ...attributes, values: value } )
				}
				__unstableOnSplitMiddle={ () =>
					createBlock( 'core/paragraph' )
				}
				onReplace={ onReplace }
				onRemove={ () => onReplace( [] ) }
				start={ start }
				reversed={ reversed }
				type={ type }
			>
				{ controls }
			</RichText>
			{ ordered && (
				<OrderedListSettings
					setAttributes={ setAttributes }
					ordered={ ordered }
					reversed={ reversed }
					start={ start }
				/>
			) }
		</>
	);
}
