import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
	__unstableRichTextInputEvent,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import { formatBold } from '@wordpress/icons';
import type { RichTextValue } from '@wordpress/rich-text';
import type { FormatEditWithVisibilityProps } from '../types';
import { applyMarkdownStyleFormat } from '../markdown-style-input-rule';

const name = 'core/bold';
const title = __( 'Bold' );

export const bold = {
	name,
	title,
	tagName: 'strong',
	className: null,
	__unstableInputRule( value: RichTextValue ): RichTextValue {
		return applyMarkdownStyleFormat( value, name, [ '**', '__' ] );
	},
	edit( {
		isActive,
		value,
		onChange,
		onFocus,
		isVisible = true,
	}: FormatEditWithVisibilityProps ): React.ReactNode {
		function onToggle() {
			onChange( toggleFormat( value, { type: name, title } ) );
		}

		function onClick() {
			onChange( toggleFormat( value, { type: name, title } ) );
			onFocus();
		}

		return (
			<>
				<RichTextShortcut
					type="primary"
					character="b"
					onUse={ onToggle }
				/>
				{ isVisible && (
					<RichTextToolbarButton
						name="bold"
						icon={ formatBold }
						title={ title }
						onClick={ onClick }
						isActive={ isActive }
						shortcutType="primary"
						shortcutCharacter="b"
					/>
				) }
				<__unstableRichTextInputEvent
					inputType="formatBold"
					onInput={ onToggle }
				/>
			</>
		);
	},
};
