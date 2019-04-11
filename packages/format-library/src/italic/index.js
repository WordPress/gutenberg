/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton, RichTextShortcut, UnstableRichTextInputEvent } from '@wordpress/block-editor';

const name = 'core/italic';

export const italic = {
	name,
	title: __( 'Italic' ),
	tagName: 'em',
	className: null,
	edit( { isActive, value, onChange } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: name } ) );

		return (
			<Fragment>
				<RichTextShortcut
					type="primary"
					character="i"
					onUse={ onToggle }
				/>
				<RichTextToolbarButton
					name="italic"
					icon="editor-italic"
					title={ __( 'Italic' ) }
					onClick={ onToggle }
					isActive={ isActive }
					shortcutType="primary"
					shortcutCharacter="i"
				/>
				<UnstableRichTextInputEvent
					inputType="formatItalic"
					onInput={ onToggle }
				/>
			</Fragment>
		);
	},
};
