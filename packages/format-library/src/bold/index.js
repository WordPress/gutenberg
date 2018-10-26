/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';

const name = 'core/bold';

export const bold = {
	name,
	title: __( 'Bold' ),
	match: {
		tagName: 'strong',
	},
	edit( { isActive, value, onChange, ToolbarButton, Shortcut } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: name } ) );

		return (
			<Fragment>
				<Shortcut
					type="primary"
					character="b"
					onUse={ onToggle }
				/>
				<ToolbarButton
					name="bold"
					icon="editor-bold"
					title={ __( 'Bold' ) }
					onClick={ onToggle }
					isActive={ isActive }
					shortcutType="primary"
					shortcutCharacter="b"
				/>
			</Fragment>
		);
	},
};
