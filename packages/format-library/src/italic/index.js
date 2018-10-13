/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { Fill, ToolbarButton } from '@wordpress/components';
import { toggleFormat } from '@wordpress/rich-text';

const Shortcut = () => null;

export const italic = {
	name: 'core/italic',
	title: __( 'Italic' ),
	match: {
		tagName: 'em',
	},
	edit( { isActive, value, onChange } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: 'em' } ) );

		return (
			<Fragment>
				<Shortcut
					type="primary"
					key="i"
					onUse={ onToggle }
				/>
				<Fill name="RichText.ToolbarControls.italic">
					<ToolbarButton
						icon="editor-italic"
						title={ __( 'Italic' ) }
						onClick={ onToggle }
						isActive={ isActive }
					/>
				</Fill>
			</Fragment>
		);
	},
};
