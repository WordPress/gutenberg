/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { ToolbarButton } from '@wordpress/components';
import { toggleFormat } from '@wordpress/rich-text';

export const bold = {
	name: 'core/bold',
	title: __( 'Bold' ),
	match: {
		tagName: 'strong',
	},
	edit( { isActive, value, onChange, FillToolbarSlot, Shortcut } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: 'core/bold' } ) );

		return (
			<Fragment>
				<Shortcut
					type="primary"
					character="b"
					onUse={ onToggle }
				/>
				<FillToolbarSlot name="bold">
					<ToolbarButton
						icon="editor-bold"
						title={ __( 'Bold' ) }
						onClick={ onToggle }
						isActive={ isActive }
					/>
				</FillToolbarSlot>
			</Fragment>
		);
	},
};
