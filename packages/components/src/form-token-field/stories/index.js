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

const continents = [
	'Africa',
	'America',
	'Antarctica',
	'Asia',
	'Europe',
	'Oceania',
];

const FormTokenFieldExample = () => {
	const [ selectedContinents, setSelectedContinents ] = useState( [] );

	return (
		<FormTokenField
			value={ selectedContinents }
			suggestions={ continents }
			onChange={ ( tokens ) => setSelectedContinents( tokens ) }
			placeholder="Type a continent"
		/>
	);
};

export const _default = () => {
	return <FormTokenFieldExample />;
};

const FormTokenFieldAsyncExample = () => {
	const [ selectedContinents, setSelectedContinents ] = useState( [] );
	const [ availableContinents, setAvailableContinents ] = useState( [] );
	const searchContinents = ( input ) => {
		setTimeout( () => {
			const available = continents.filter( ( continent ) =>
				continent.toLowerCase().includes( input.toLowerCase() )
			);
			setAvailableContinents( available );
		}, 1000 );
	};

	return (
		<FormTokenField
			value={ selectedContinents }
			suggestions={ availableContinents }
			onChange={ ( tokens ) => setSelectedContinents( tokens ) }
			onInputChange={ searchContinents }
			placeholder="Type a continent"
		/>
	);
};

export const _async = () => {
	return <FormTokenFieldAsyncExample />;
};
