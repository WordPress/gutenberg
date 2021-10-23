/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
	__unstableRichTextInputEvent,
} from '@wordpress/block-editor';
import { formatBold } from '@wordpress/icons';

const name = 'core/bold';
const title = __( 'Bold' );

export const bold = {
	name,
	title,
	tagName: 'strong',
	className: null,
	edit( { isActive, value, onChange, onFocus } ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name } ) );
			// For screen readers, will announce if Bold is active or not. Because isActive is not updated yet, flip the value and then compare type true/false.
			if ( ! isActive === true ) {
				// translators: %s: title of the formatting control
				speak( sprintf( __( '%s applied.' ), title ), 'assertive' );
			} else {
				// translators: %s: title of the formatting control
				speak( sprintf( __( '%s removed.' ), title ), 'assertive' );
			}
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		return (
			<>
				<RichTextShortcut
					type="primary"
					character="b"
					onUse={ onToggle }
				/>
				<RichTextToolbarButton
					name="bold"
					icon={ formatBold }
					title={ title }
					onClick={ onClick }
					isActive={ isActive }
					shortcutType="primary"
					shortcutCharacter="b"
				/>
				<__unstableRichTextInputEvent
					inputType="formatBold"
					onInput={ onToggle }
				/>
			</>
		);
	},
};
