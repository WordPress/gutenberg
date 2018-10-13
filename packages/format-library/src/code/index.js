/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';

const Shortcut = () => null;

export const code = {
	name: 'core/code',
	title: __( 'Code' ),
	match: {
		tagName: 'code',
	},
	edit( { value, onChange } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: 'code' } ) );

		return (
			<Fragment>
				<Shortcut
					type="access"
					key="x"
					onUse={ onToggle }
				/>
			</Fragment>
		);
	},
};
