/**
 * External dependencies
 */
const json2md = require( 'json2md' );

/**
 * Internal dependencies
 */
const { generateMarkdownPropsJson } = require( './props' );

function generateMarkdownDocs( { typeDocs, subcomponentTypeDocs } ) {
	const mainDocsJson = [
		'<!-- This file is generated automatically and cannot be edited directly. -->\n',
		{ h1: typeDocs.displayName },
		{
			p: `<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-${ typeDocs.displayName.toLowerCase() }--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>`,
		},
		typeDocs.description,
		...generateMarkdownPropsJson( typeDocs.props ),
	];

	const subcomponentDocsJson = subcomponentTypeDocs
		? [
				{ h2: 'Subcomponents' },
				...subcomponentTypeDocs.flatMap( ( subcomponentTypeDoc ) => [
					{
						h3: subcomponentTypeDoc.displayName,
					},
					subcomponentTypeDoc.description,
					...generateMarkdownPropsJson( subcomponentTypeDoc.props, {
						headingLevel: 4,
					} ),
				] ),
		  ]
		: [];

	return json2md(
		[ ...mainDocsJson, ...subcomponentDocsJson ].filter( Boolean )
	);
}

module.exports = {
	generateMarkdownDocs,
};
