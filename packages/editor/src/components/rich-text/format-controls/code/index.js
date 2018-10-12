/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';

const Shortcut = () => null;

export const code = {
	format: 'code',
	selector: 'code',
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
