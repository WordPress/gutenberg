/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { Fill, ToolbarButton } from '@wordpress/components';
import { toggleFormat } from '@wordpress/rich-text';

const Shortcut = () => null;

export const strikethrough = {
	name: 'core/strikethrough',
	title: __( 'Strikethrough' ),
	match: {
		tagName: 'del',
	},
	edit( { isActive, value, onChange } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: 'core/strikethrough' } ) );

		return (
			<Fragment>
				<Shortcut
					type="access"
					key="d"
					onUse={ onToggle }
				/>
				<Fill name="RichText.ToolbarControls.strikethrough">
					<ToolbarButton
						icon="editor-strikethrough"
						title={ __( 'Strikethrough' ) }
						onClick={ onToggle }
						isActive={ isActive }
					/>
				</Fill>
			</Fragment>
		);
	},
};
