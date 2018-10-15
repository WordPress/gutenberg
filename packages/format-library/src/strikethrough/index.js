/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { ToolbarButton } from '@wordpress/components';
import { toggleFormat } from '@wordpress/rich-text';

export const strikethrough = {
	name: 'core/strikethrough',
	title: __( 'Strikethrough' ),
	match: {
		tagName: 'del',
	},
	edit( { isActive, value, onChange, FillToolbarSlot, Shortcut } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: 'core/strikethrough' } ) );

		return (
			<Fragment>
				<Shortcut
					type="access"
					character="d"
					onUse={ onToggle }
				/>
				<FillToolbarSlot name="strikethrough">
					<ToolbarButton
						icon="editor-strikethrough"
						title={ __( 'Strikethrough' ) }
						onClick={ onToggle }
						isActive={ isActive }
					/>
				</FillToolbarSlot>
			</Fragment>
		);
	},
};
