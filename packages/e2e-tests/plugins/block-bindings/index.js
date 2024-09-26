const { unlock } =
	wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/blocks'
	);

const { registerBlockBindingsSource } = unlock( wp.blocks.privateApis );

const fieldsList = {
	field_1: {
		label: 'Field 1',
		value: 'Field 1 Value',
	},
	field_2: {
		label: 'Field 2',
		value: '',
	},
	field_3: {
		label: 'Field 3',
	},
};

const testingSource = {
	name: 'testing/custom-source',
	label: 'Custom Source',
	getValues: ( { bindings } ) => {
		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			newValues[ attributeName ] =
				'New value: ' + fieldsList[ source.args.key ]?.value;
		}
		return newValues;
	},
	setValues: ( { bindings } ) => {
		Object.values( bindings ).forEach( () => {
			// UPDATE SETTINGS.
		} );
	},
	canUserEditValues: () => true,
	getFieldsList: () => fieldsList,
};

registerBlockBindingsSource( testingSource );

// SERVER SOURCE.
// CLIENT ONLY SOURCE.
