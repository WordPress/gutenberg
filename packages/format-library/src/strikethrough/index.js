/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton, RichTextShortcut } from '@wordpress/editor';

const name = 'core/strikethrough';

export const strikethrough = {
	name,
	title: __( 'Strikethrough' ),
	match: {
		tagName: 'del',
	},
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
					name="strikethrough"
					icon="editor-strikethrough"
					title={ __( 'Strikethrough' ) }
					onClick={ onToggle }
					isActive={ isActive }
					shortcutType="access"
					shortcutCharacter="d"
				/>
			</Fragment>
		);
	},
};
