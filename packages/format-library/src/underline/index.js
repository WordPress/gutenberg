/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton, RichTextShortcut, __unstableRichTextInputEvent } from '@wordpress/block-editor';
import { Platform } from '@wordpress/element';

const name = 'core/underline';
const title = __( 'Underline' );

export const underline = {
	name,
	title: __( 'Underline' ),
	tagName: 'span',
	className: null,
	attributes: {
		style: 'style',
	},
	edit( { isActive, value, onChange } ) {
		const onToggle = () => {
			onChange(
				toggleFormat( value, {
					type: name,
					attributes: {
						style: 'text-decoration: underline;',
					},
				} ) );
		};
		const button = (
			<RichTextToolbarButton
				name="underline"
				icon="editor-underline"
				title={ title }
				onClick={ onToggle }
				isActive={ isActive }
				shortcutType="primary"
				shortcutCharacter="u"
			/>
		);
		return (
			<>
				<RichTextShortcut
					type="primary"
					character="u"
					onUse={ onToggle }
				/>
				{ Platform.OS === 'web' ? null : button }
				<__unstableRichTextInputEvent
					inputType="formatUnderline"
					onInput={ onToggle }
				/>
			</>
		);
	},
};
