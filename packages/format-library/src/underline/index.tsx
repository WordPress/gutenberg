import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextShortcut,
	__unstableRichTextInputEvent,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import type { RichTextValue } from '@wordpress/rich-text';

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
	edit( {
		value,
		onChange,
	}: {
		value: RichTextValue;
		onChange: ( value: RichTextValue ) => void;
	} ) {
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
			</>
		);
	},
};
