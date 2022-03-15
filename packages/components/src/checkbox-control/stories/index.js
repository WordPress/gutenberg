/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CheckboxControl from '../';

export default {
	title: 'Components/CheckboxControl',
	component: CheckboxControl,
	parameters: {
		knobs: { disable: false },
	},
};

const CheckboxControlWithState = ( { checked, ...props } ) => {
	const [ isChecked, setChecked ] = useState( checked );

	return (
		<CheckboxControl
			{ ...props }
			checked={ isChecked }
			onChange={ setChecked }
		/>
	);
};

export const _default = () => {
	const label = text( 'Label', 'Is author' );

	return <CheckboxControlWithState label={ label } checked />;
};

export const all = () => {
	const label = text( 'Label', 'Is author' );
	const help = text( 'Help', 'Is the user an author or not?' );

	return <CheckboxControlWithState label={ label } help={ help } checked />;
};

export const Indeterminate = () => {
	const [ fruits, setFruits ] = useState( { apple: false, orange: false } );

	const isAllChecked = Object.values( fruits ).every( Boolean );
	const isIndeterminate =
		Object.values( fruits ).some( Boolean ) && ! isAllChecked;

	return (
		<>
			<CheckboxControl
				label="Select All"
				checked={ isAllChecked }
				indeterminate={ isIndeterminate }
				onChange={ ( newValue ) =>
					setFruits( {
						apple: newValue,
						orange: newValue,
					} )
				}
			/>
			<CheckboxControl
				label="Apple"
				checked={ fruits.apple }
				onChange={ ( apple ) =>
					setFruits( ( prevState ) => ( {
						...prevState,
						apple,
					} ) )
				}
			/>
			<CheckboxControl
				label="Orange"
				checked={ fruits.orange }
				onChange={ ( orange ) =>
					setFruits( ( prevState ) => ( {
						...prevState,
						orange,
					} ) )
				}
			/>
		</>
	);
};
