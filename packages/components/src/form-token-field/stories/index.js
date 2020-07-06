/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormTokenField from '../';

export default {
	title: 'Components/FormTokenField',
	component: FormTokenField,
};

const FormTokenFieldWithState = ( { initialValue, ...props } ) => {
	const [ value, setValue ] = useState( initialValue );
	return (
		<FormTokenField
			{ ...props }
			value={ value }
			suggestions={ [ 'Foo', 'Bar', 'Baz' ] }
			onChange={ setValue }
		/>
	);
};

export const _default = () => {
	return <FormTokenFieldWithState initialValue={ [ 'Foo' ] } />;
};

export const disabled = () => {
	return <FormTokenFieldWithState initialValue={ [ 'Foo' ] } disabled />;
};
