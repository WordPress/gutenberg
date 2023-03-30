/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { formatListNumbered, keyboardReturn } from '@wordpress/icons';
import {
	Popover,
	Button,
	TextControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

const name = 'core/footnote';
const title = __( 'Footnote' );

export const footnote = {
	name,
	title,
	tagName: 'a',
	className: 'note-link',
	shortcode: '#',
	edit( {
		isObjectActive,
		value,
		onChange,
		onFocus,
		contentRef,
		activeObjectAttributes,
	} ) {
		function onClick() {
			const newValue = insertObject( value, {
				type: name,
				attributes: {
					contenteditable: 'false',
					'data-shortcode-content': '',
				},
			} );
			newValue.start = newValue.end - 1;
			onChange( newValue );
			onFocus();
		}

		return (
			<>
				<RichTextToolbarButton
					icon={ formatListNumbered }
					title={ title }
					onClick={ onClick }
					isActive={ isObjectActive }
				/>
				{ isObjectActive && (
					<InlineUI
						value={ value }
						onChange={ onChange }
						activeObjectAttributes={ activeObjectAttributes }
						contentRef={ contentRef }
					/>
				) }
			</>
		);
	},
};

function InlineUI( { value, onChange, activeObjectAttributes, contentRef } ) {
	const { 'data-shortcode-content': shortcodeContent } =
		activeObjectAttributes;
	const [ note, setNote ] = useState( shortcodeContent );
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: footnote,
	} );

	return (
		<Popover
			placement="bottom"
			focusOnMount={ false }
			anchor={ popoverAnchor }
			className="block-editor-format-toolbar__image-popover"
		>
			<form
				className="block-editor-format-toolbar__image-container-content"
				onSubmit={ ( event ) => {
					const newReplacements = value.replacements.slice();

					newReplacements[ value.start ] = {
						type: name,
						attributes: {
							...activeObjectAttributes,
							'data-shortcode-content': note,
						},
					};

					onChange( {
						...value,
						replacements: newReplacements,
					} );

					event.preventDefault();
				} }
			>
				<HStack alignment="bottom" spacing="0">
					<TextControl
						className="block-editor-format-toolbar__image-container-value"
						label={ __( 'Note' ) }
						value={ note }
						onChange={ ( newNote ) => setNote( newNote ) }
					/>
					<Button
						className="block-editor-format-toolbar__image-container-button"
						icon={ keyboardReturn }
						label={ __( 'Apply' ) }
						type="submit"
					/>
				</HStack>
			</form>
		</Popover>
	);
}
