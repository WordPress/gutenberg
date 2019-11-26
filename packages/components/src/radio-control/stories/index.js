/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RadioControl from '../';

export default { title: 'Components|RadioControl', component: RadioControl };

const RadioControlWithState = ( props ) => {
	const [ option, setOption ] = useState( 'public' );

	return (
		<RadioControl
			{ ...props }
			selected={ option }
			onChange={ setOption }
		/>
	);
};

const options = [
	{ label: 'Public', value: 'public' },
	{ label: 'Private', value: 'private' },
	{ label: 'Password Protected', value: 'password' },
];

export const _default = () => {
	return (
		<RadioControlWithState
			label="Post visibility"
			options={ options }
		/>
	);
};

export const withHelp = () => {
	return (
		<RadioControlWithState
			help="The visibility level for the current post"
			label="Post visibility"
			options={ options }
		/>
	);
};

