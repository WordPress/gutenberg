/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { ToolbarButton } from '@wordpress/components';
import { toggleFormat } from '@wordpress/rich-text';

const name = 'core/bold';

export const italic = {
	name,
	title: __( 'Italic' ),
	match: {
		tagName: 'em',
	},
	edit( { isActive, value, onChange, FillToolbarSlot, Shortcut } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: name } ) );

		return (
			<Fragment>
				<Shortcut
					type="primary"
					character="i"
					onUse={ onToggle }
				/>
				<FillToolbarSlot name="italic">
					<ToolbarButton
						icon="editor-italic"
						title={ __( 'Italic' ) }
						onClick={ onToggle }
						isActive={ isActive }
					/>
				</FillToolbarSlot>
			</Fragment>
		);
	},
};
