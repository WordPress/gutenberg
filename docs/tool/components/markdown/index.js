/**
 * External dependencies
 */
const json2md = require( 'json2md' );

/**
 * Internal dependencies
 */
const { generateMarkdownPropsJson } = require( './props' );

function generateStorybookCallout( componentId ) {
	return `<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-${ componentId }--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>`;
}

function generateMarkdownDocs( { typeDocs, subcomponentTypeDocs } ) {
	const docsJson = [
		'<!-- This file is generated automatically and cannot be edited directly. -->\n',
		{ h1: typeDocs.displayName },
		{ p: generateStorybookCallout( typeDocs.displayName.toLowerCase() ) },
		typeDocs.description,
		...generateMarkdownPropsJson( typeDocs.props ),

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
	].filter( Boolean );

	return json2md( docsJson );
}

module.exports = {
	generateMarkdownDocs,
};
