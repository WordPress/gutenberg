/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';
import { Popover, TextControl } from '@wordpress/components';

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
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: footnote,
	} );

	return (
		<Popover
			placement="bottom"
			focusOnMount={ true }
			anchor={ popoverAnchor }
			className="block-editor-format-toolbar__image-popover"
		>
			<TextControl
				className="block-editor-format-toolbar__image-container-value"
				label={ __( 'Note' ) }
				value={ shortcodeContent }
				onChange={ ( newNote ) => {
					const newReplacements = value.replacements.slice();

					newReplacements[ value.start ] = {
						type: name,
						attributes: {
							...activeObjectAttributes,
							'data-shortcode-content': newNote,
						},
					};

					onChange( {
						...value,
						replacements: newReplacements,
					} );
				} }
			/>
		</Popover>
	);
}
