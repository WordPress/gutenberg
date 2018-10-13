/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { Fill, ToolbarButton } from '@wordpress/components';
import { toggleFormat } from '@wordpress/rich-text';

const Shortcut = () => null;

export const bold = {
	name: 'core/bold',
	title: __( 'Bold' ),
	match: {
		tagName: 'strong',
	},
	edit( { isActive, value, onChange } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: 'strong' } ) );

		return (
			<Fragment>
				<Shortcut
					type="primary"
					key="b"
					onUse={ onToggle }
				/>
				<Fill name="RichText.ToolbarControls.bold">
					<ToolbarButton
						icon="editor-bold"
						title={ __( 'Bold' ) }
						onClick={ onToggle }
						isActive={ isActive }
					/>
				</Fill>
			</Fragment>
		);
	},
};
