/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	RichText,
	BlockControls,
	RichTextShortcut,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	Toolbar,
	BaseControl,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import {
	__unstableIndentListItems as indentListItems,
	__unstableOutdentListItems as outdentListItems,
	__unstableChangeListType as changeListType,
	__unstableIsListRootSelected as isListRootSelected,
	__unstableIsActiveListType as isActiveListType,
} from '@wordpress/rich-text';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { name } from './';

function ListEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	className,
	instanceId,
} ) {
	const { ordered, values, reversed, start } = attributes;
	const tagName = ordered ? 'ol' : 'ul';
	const startValueId = `block-list-startValue-input-${ instanceId }`;

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
			wrapperClassName="block-library-list"
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
		{ ordered &&
			<InspectorControls>
				<PanelBody title={ __( 'Ordered List Settings' ) }>
					<BaseControl label={ __( 'Start Value' ) } id={ startValueId } >
						<input
							type="number"
							onChange={ ( event ) => {
								setAttributes( { start: parseInt( event.target.value, 10 ) } );
								if ( isNaN( parseInt( event.target.value, 10 ) ) ) {
									setAttributes( { start: null } );
								}
							} }
							value={ start ? start : '' }
							step="1"
						/>
					</BaseControl>
					<ToggleControl
						label={ __( 'Reverse List' ) }
						checked={ reversed }
						onChange={ ( ) => {
							setAttributes( { reversed: ! reversed } );
						} }
					/>
				</PanelBody>
			</InspectorControls>
		}
	</>;
}

export default withInstanceId( ListEdit );
