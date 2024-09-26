const { unlock } =
	wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/blocks'
	);

const { registerBlockBindingsSource } = unlock( wp.blocks.privateApis );
const { fieldsList } = window.testingBindings || {};

const getValues = ( { bindings } ) => {
	const newValues = {};
	for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
		newValues[ attributeName ] = fieldsList[ source.args.key ]?.value;
	}
	return newValues;
};
const setValues = () => {
	// DO NOTHING
};

registerBlockBindingsSource( {
	name: 'testing/get-values',
	label: 'Get Values',
	getValues,
} );

registerBlockBindingsSource( {
	name: 'testing/can-user-edit-false',
	label: 'Can User Edit: False',
	getValues,
	setValues,
	canUserEditValue: () => false,
} );

registerBlockBindingsSource( {
	name: 'testing/can-user-edit-undefined',
	label: 'Can User Edit: Undefined',
	getValues,
	setValues,
} );

registerBlockBindingsSource( {
	name: 'testing/set-values-undefined',
	label: 'Set Values: Undefined',
	getValues,
	canUserEditValue: () => true,
} );

registerBlockBindingsSource( {
	name: 'testing/get-fields-list',
	label: 'Get Fields List',
	getValues,
	getFieldsList: () => fieldsList,
} );
