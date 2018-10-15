/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';

export const code = {
	name: 'core/code',
	title: __( 'Code' ),
	match: {
		tagName: 'code',
	},
	edit( { value, onChange, Shortcut } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: 'core/code' } ) );

		return (
			<Fragment>
				<Shortcut
					type="access"
					character="x"
					onUse={ onToggle }
				/>
			</Fragment>
		);
	},
};
