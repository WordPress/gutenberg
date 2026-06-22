const { registerBlockBindingsSource } = wp.blocks;
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
	getFieldsList() {
		return Object.entries( fieldsList || {} ).map( ( [ key, field ] ) => ( {
			label: field.label || key,
			type: field.type || 'string',
			args: field.args || { key },
		} ) );
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

/**
 * Inner-blocks example/test binding sources.
 *
 * These sources exercise the reserved `innerBlocks` binding key independently of
 * `core/pattern-overrides`, proving the mechanism end to end (read, write,
 * read-only, absence). They are deliberately **context-free** — they read no
 * block/ancestry context and resolve purely from a fixed fixture — so the editor
 * read (here) and the frontend read (the PHP source registered in
 * `block-bindings.php`) always match for the same source state regardless of
 * where the bound block sits in the tree.
 *
 * The fixture string below is the canonical serialized block markup the read
 * sources supply. It is duplicated verbatim in the PHP plugin
 * (`block-bindings.php`) so the JS/PHP equivalence of the value contract can be
 * observed: parsing it in the editor (`parse()`) and on the frontend
 * (`parse_blocks()`) yields the same inner blocks.
 *
 * @type {string}
 */
const innerBlocksFixture =
	'<!-- wp:paragraph -->\n<p>Source Paragraph 1</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Source Paragraph 2</p>\n<!-- /wp:paragraph -->';

/**
 * Resolves the reserved `innerBlocks` key to the fixed fixture string,
 * demonstrating the read (supply) path for inner-block bindings.
 *
 * @param {Object} options          Resolution options provided by the resolver.
 * @param {Object} options.bindings The bindings payload; the resolver passes the
 *                                  reserved `innerBlocks` key under it.
 * @return {Object} A values object carrying `innerBlocks` as a serialized
 *                   block-markup string when that key is bound.
 */
const getInnerBlocksValues = ( { bindings } ) => {
	const newValues = {};
	if ( bindings?.innerBlocks ) {
		newValues.innerBlocks = innerBlocksFixture;
	}
	return newValues;
};

/**
 * Records the serialized inner blocks received from an edit by storing them in a
 * post-meta field, demonstrating the write-back path. The e2e suite reads the
 * field back to assert the source received the edited blocks.
 *
 * @param {Object} options          Resolution options provided by the resolver.
 * @param {Object} options.dispatch The data-registry `dispatch`.
 * @param {Object} options.context  The block context (carries `postType`/`postId`).
 * @param {Object} options.bindings The bindings payload, including the reserved
 *                                  `innerBlocks` key with its serialized `newValue`.
 */
const setInnerBlocksValues = ( { dispatch, context, bindings } ) => {
	const newValue = bindings?.innerBlocks?.newValue;
	if ( newValue === undefined ) {
		return;
	}
	dispatch( 'core' ).editEntityRecord(
		'postType',
		context?.postType,
		context?.postId,
		{
			meta: { text_custom_field: newValue },
		}
	);
};

registerBlockBindingsSource( {
	name: 'testing/inner-blocks-source',
	label: 'Inner Blocks Source',
	usesContext: [ 'postType', 'postId' ],
	getValues: getInnerBlocksValues,
	setValues: setInnerBlocksValues,
	canUserEditValue: () => true,
} );

registerBlockBindingsSource( {
	name: 'testing/inner-blocks-source-read-only',
	label: 'Inner Blocks Source (Read Only)',
	usesContext: [ 'postType', 'postId' ],
	getValues: getInnerBlocksValues,
	setValues: setInnerBlocksValues,
	canUserEditValue: () => false,
} );

registerBlockBindingsSource( {
	name: 'testing/inner-blocks-source-absence',
	label: 'Inner Blocks Source (Absence)',
	getValues: () => ( {} ),
	canUserEditValue: () => true,
} );
