import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
	__unstableRichTextInputEvent,
} from '@wordpress/block-editor';
import { formatItalic } from '@wordpress/icons';

/*
 * Internal dependencies
 */
import type { BoldEditProps } from '../types';

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
	}: BoldEditProps ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name } ) );
		}

		function onClick() {
			onChange( toggleFormat( value, { type: name } ) );
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
