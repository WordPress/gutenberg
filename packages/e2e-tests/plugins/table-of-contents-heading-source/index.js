( function () {
	const { registerBlockType } = wp.blocks;
	const { useBlockProps } = wp.blockEditor;
	const { createElement: el } = wp.element;

	registerBlockType( 'e2e-tests/table-of-contents-heading-source', {
		apiVersion: 3,
		title: 'ToC Heading Source',
		description: 'A test block that renders a heading-like section.',
		category: 'text',
		attributes: {
			content: {
				type: 'string',
				default: 'Plugin heading source',
			},
			anchor: {
				type: 'string',
				default: 'plugin-heading-source',
			},
			level: {
				type: 'number',
				default: 2,
			},
		},
		edit: function Edit( { attributes } ) {
			const TagName = `h${ attributes.level }`;

			return el(
				TagName,
				useBlockProps( { id: attributes.anchor } ),
				attributes.content
			);
		},
		save: function Save( { attributes } ) {
			const TagName = `h${ attributes.level }`;

			return el(
				TagName,
				useBlockProps.save( { id: attributes.anchor } ),
				attributes.content
			);
		},
	} );

	registerBlockType( 'e2e-tests/table-of-contents-heading-like', {
		apiVersion: 3,
		title: 'ToC Heading Like',
		description: 'A test block that renders a heading-like section.',
		category: 'text',
		attributes: {
			content: {
				type: 'string',
				default: 'Unregistered heading-like source',
			},
			anchor: {
				type: 'string',
				default: 'unregistered-heading-like-source',
			},
			level: {
				type: 'number',
				default: 2,
			},
		},
		edit: function Edit( { attributes } ) {
			const TagName = `h${ attributes.level }`;

			return el(
				TagName,
				useBlockProps( { id: attributes.anchor } ),
				attributes.content
			);
		},
		save: function Save( { attributes } ) {
			const TagName = `h${ attributes.level }`;

			return el(
				TagName,
				useBlockProps.save( { id: attributes.anchor } ),
				attributes.content
			);
		},
	} );
} )();
