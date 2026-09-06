import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
	__unstableRichTextInputEvent,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import { formatItalic } from '@wordpress/icons';
import type { FormatEditWithVisibilityProps } from '../types';

const name = 'core/italic';
const title = __( 'Italic' );

export const italic = {
	name,
	title,
	tagName: 'em',
	className: null,
	edit( {
		isActive,
		value,
		onChange,
		onFocus,
		isVisible = true,
	}: FormatEditWithVisibilityProps ) {
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
					character="i"
					onUse={ onToggle }
				/>
				{ isVisible && (
					<RichTextToolbarButton
						name="italic"
						icon={ formatItalic }
						title={ title }
						onClick={ onClick }
						isActive={ isActive }
						shortcutType="primary"
						shortcutCharacter="i"
					/>
				) }
				<__unstableRichTextInputEvent
					inputType="formatItalic"
					onInput={ onToggle }
				/>
			</>
		);
	},
};
