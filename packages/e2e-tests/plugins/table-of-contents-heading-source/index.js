( function () {
	const { registerBlockType } = wp.blocks;
	const { useBlockProps } = wp.blockEditor;
	const { createElement: el } = wp.element;

	function getHeadingTagName( level ) {
		return Number.isInteger( level ) && level >= 1 && level <= 6
			? `h${ level }`
			: 'h2';
	}

	function getAnchorProps( anchor ) {
		return typeof anchor === 'string' && anchor !== ''
			? { id: anchor }
			: {};
	}

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
			const TagName = getHeadingTagName( attributes.level );

			return el(
				TagName,
				useBlockProps( getAnchorProps( attributes.anchor ) ),
				attributes.content
			);
		},
		save: function Save( { attributes } ) {
			const TagName = getHeadingTagName( attributes.level );

			return el(
				TagName,
				useBlockProps.save( getAnchorProps( attributes.anchor ) ),
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
				default: 'Plain heading-like block',
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
			const TagName = getHeadingTagName( attributes.level );

			return el(
				TagName,
				useBlockProps( getAnchorProps( attributes.anchor ) ),
				attributes.content
			);
		},
		save: function Save( { attributes } ) {
			const TagName = getHeadingTagName( attributes.level );

			return el(
				TagName,
				useBlockProps.save( getAnchorProps( attributes.anchor ) ),
				attributes.content
			);
		},
	} );
} )();
