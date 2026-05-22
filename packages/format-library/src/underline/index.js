/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextShortcut,
	RichTextToolbarButton,
	__unstableRichTextInputEvent,
} from '@wordpress/block-editor';
import { formatUnderline } from '@wordpress/icons';

const name = 'core/underline';
const title = __( 'Underline' );

export const underline = {
	name,
	title,
	tagName: 'span',
	className: null,
	attributes: {
		style: 'style',
	},
	edit( { isActive, value, onChange, onFocus } ) {
		const onToggle = () => {
			onChange(
				toggleFormat( value, {
					type: name,
					attributes: {
						style: 'text-decoration: underline;',
					},
					title,
				} )
			);
			onFocus();
		};

		return (
			<>
				<RichTextShortcut
					type="primary"
					character="u"
					onUse={ onToggle }
				/>
				<__unstableRichTextInputEvent
					inputType="formatUnderline"
					onInput={ onToggle }
				/>
				<RichTextToolbarButton
					icon={ formatUnderline }
					title={ title }
					onClick={ onToggle }
					isActive={ isActive }
					role="menuitemcheckbox"
				/>
			</>
		);
	},
};
