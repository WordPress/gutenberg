const { unlock } =
	wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/blocks'
	);

const { registerBlockBindingsSource } = unlock( wp.blocks.privateApis );
const { fieldsList } = window.testingBindings || {};

const testingSource = {
	name: 'testing/custom-source',
	label: 'Custom Source',
	getValues: ( { bindings } ) => {
		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			newValues[ attributeName ] = fieldsList[ source.args.key ]?.value;
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
