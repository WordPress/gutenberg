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
const setValues = ( { dispatch, context, bindings } ) => {
	const newMeta = {};
	Object.values( bindings ).forEach( ( { args, newValue } ) => {
		newMeta[ args.key ] = newValue;
	} );

	dispatch( 'core' ).editEntityRecord(
		'postType',
		context?.postType,
		context?.postId,
		{
			meta: newMeta,
		}
	);
};

registerBlockBindingsSource( {
	name: 'testing/complete-source',
	getValues,
	setValues,
	canUserEditValue: () => true,
	editorUI() {
		return {
			mode: 'dropdown',
			data: Object.entries( fieldsList || {} ).map(
				( [ key, field ] ) => ( {
					label: field?.label || key,
					type: field?.type || 'string',
					args: {
						key,
					},
				} )
			),
		};
	},
} );

const ModalButton = ( { fieldKey, fieldLabel, attribute, closeModal } ) => {
	const { updateBlockBindings } = wp.blockEditor.useBlockBindingsUtils();

	return el(
		'button',
		{
			onClick: () => {
				updateBlockBindings( {
					[ attribute ]: {
						source: 'testing/modal-source',
						args: { key: fieldKey },
					},
				} );
				closeModal();
			},
			style: {
				display: 'block',
				margin: '5px 0',
				padding: '10px',
				width: '100%',
			},
		},
		fieldLabel
	);
};

registerBlockBindingsSource( {
	name: 'testing/modal-source',
	label: 'Modal Source',
	getValues,
	setValues,
	canUserEditValue: () => true,
	editorUI() {
		return {
			mode: 'modal',
			data: Object.entries( fieldsList || {} ).map(
				( [ key, field ] ) => ( {
					label: field?.label || key,
					type: field?.type || 'string',
					args: {
						key,
					},
				} )
			),
			renderModalContent( { attribute, closeModal } ) {
				return el(
					'div',
					{ style: { padding: '20px' } },
					el( 'h3', null, 'Select a field from the modal' ),
					el(
						'p',
						null,
						'This is a modal interface for selecting fields.'
					),
					Object.entries( fieldsList || {} ).map(
						( [ key, field ] ) =>
							el( ModalButton, {
								key,
								fieldKey: key,
								fieldLabel: field?.label || key,
								attribute,
								closeModal,
							} )
					)
				);
			},
		};
	},
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
