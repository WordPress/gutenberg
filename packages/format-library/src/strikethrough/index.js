/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';

const name = 'core/strikethrough';

export const strikethrough = {
	name,
	title: __( 'Strikethrough' ),
	match: {
		tagName: 'del',
	},
	edit( { isActive, value, onChange, ToolbarButton, Shortcut } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: name } ) );

		return (
			<Fragment>
				<Shortcut
					type="access"
					character="d"
					onUse={ onToggle }
				/>
				<ToolbarButton
					name="strikethrough"
					icon="editor-strikethrough"
					title={ __( 'Strikethrough' ) }
					onClick={ onToggle }
					isActive={ isActive }
				/>
			</Fragment>
		);
	},
};
