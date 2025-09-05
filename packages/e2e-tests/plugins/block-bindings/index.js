const { registerBlockBindingsSource } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl } = wp.components;
const { createHigherOrderComponent } = wp.compose;
const { createElement: el, Fragment } = wp.element;
const { addFilter } = wp.hooks;
const { fieldsList } = window.testingBindings || {};

const getValues = ( { bindings } ) => {
	const newValues = {};
	for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
		newValues[ attributeName ] = fieldsList[ source.args.key ]?.value;
	}
	return newValues;
};
const setValues = ( { dispatch, bindings } ) => {
	Object.values( bindings ).forEach( ( { args, newValue } ) => {
		// Example of what could be done.
		dispatch( 'core' ).editEntityRecord( 'postType', 'post', 1, {
			meta: { [ args?.key ]: newValue },
		} );
	} );
};

registerBlockBindingsSource( {
	name: 'testing/complete-source',
	getValues,
	setValues,
	canUserEditValue: () => true,
	getFieldsList: () => fieldsList,
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

const withBlockBindingsInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			if ( ! props.attributes?.metadata?.bindings?.content ) {
				return el( BlockEdit, props );
			}

			return el(
				Fragment,
				{},
				el( BlockEdit, props ),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: 'Bindings' },
						el( TextControl, {
							__next40pxDefaultSize: true,
							__nextHasNoMarginBottom: true,
							label: 'Content',
							value: props.attributes.content,
							onChange: ( content ) =>
								props.setAttributes( {
									content,
								} ),
						} )
					)
				)
			);
		};
	}
);

addFilter(
	'editor.BlockEdit',
	'testing/bindings-inspector-control',
	withBlockBindingsInspectorControl
);
