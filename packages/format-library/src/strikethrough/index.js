/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton, RichTextShortcut } from '@wordpress/block-editor';

const name = 'core/strikethrough';
const title = __( 'Strikethrough' );

export const strikethrough = {
	name,
	title,
	tagName: 's',
	className: null,
	edit( { isActive, value, onChange } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: name } ) );

		return (
			<Fragment>
				<RichTextShortcut
					type="access"
					character="d"
					onUse={ onToggle }
				/>
				<RichTextToolbarButton
					icon="editor-strikethrough"
					title={ title }
					onClick={ onToggle }
					isActive={ isActive }
					shortcutType="access"
					shortcutCharacter="d"
				/>
			</Fragment>
		);
	},
};
