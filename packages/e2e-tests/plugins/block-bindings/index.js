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
	editorUI: () => ( {
		mode: 'dropdown',
		data: Object.entries( fieldsList || {} ).map( ( [ key, field ] ) => ( {
			key,
			label: field?.label || key,
			type: field?.type || 'string',
			value: field?.value,
		} ) ),
		onSelect( { value, updateBlockBindings, attribute } ) {
			updateBlockBindings( {
				[ attribute ]: {
					source: 'testing/complete-source',
					args: {
						key: value,
					},
				},
			} );
		},
	} ),
} );

registerBlockBindingsSource( {
	name: 'testing/modal-source',
	label: 'Modal Source',
	getValues,
	setValues,
	canUserEditValue: () => true,
	editorUI: () => ( {
		mode: 'modal',
		data: Object.entries( fieldsList || {} ).map( ( [ key, field ] ) => ( {
			key,
			label: field?.label || key,
			type: field?.type || 'string',
			value: field?.value,
		} ) ),
		renderModalContent: ( { updateBlockBindings } ) => {
			return el(
				'div',
				{ style: { padding: '20px' } },
				el( 'h3', null, 'Select a field from the modal' ),
				el(
					'p',
					null,
					'This is a modal interface for selecting fields.'
				),
				Object.entries( fieldsList || {} ).map( ( [ key, field ] ) =>
					el(
						'button',
						{
							key,
							onClick: () => {
								updateBlockBindings( {
									content: {
										source: 'testing/modal-source',
										args: { key },
									},
								} );
							},
							style: {
								display: 'block',
								margin: '5px 0',
								padding: '10px',
								width: '100%',
							},
						},
						field?.label || key
					)
				)
			);
		},
	} ),
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
