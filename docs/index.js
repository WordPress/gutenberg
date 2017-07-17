/**
 * WordPress dependencies
 */
import { addStory } from 'docutron';

addStory( {
	name: 'intro',
	title: 'Introduction',
	path: '/',
	markdown: require( './readme.md' ),
} );

addStory( {
	name: 'blocks',
	title: 'Creating Block Types',
	markdown: require( './blocks.md' ),
} );

addStory( {
	parents: [ 'blocks' ],
	name: 'writing-your-first-block-type',
	title: 'Writing Your First Block Type',
	markdown: require( 'blocks-basic.md' ),
} );

addStory( {
	parents: [ 'blocks' ],
	name: 'applying-styles-with-stylesheets',
	title: 'Applying Styles With Stylesheets',
	markdown: require( './blocks-stylesheet.md' ),
} );

addStory( {
	parents: [ 'blocks' ],
	name: 'introducing-attributes-and-editable-fields',
	title: 'Introducing Attributes and Editable Fields',
	markdown: require( './blocks-editable.md' ),
} );

addStory( {
	parents: [ 'blocks' ],
	name: 'block-controls-toolbars-and-inspector',
	title: 'Block Controls: Toolbars and Inspector',
	markdown: require( './blocks-controls.md' ),
} );

addStory( {
	name: 'reference',
	title: 'Reference',
	markdown: require( './reference.md' ),
} );

addStory( {
	parents: [ 'reference' ],
	name: 'attribute-matchers',
	title: 'Attribute Matchers',
	markdown: require( './attribute-matchers.md' ),
} );

addStory( {
	parents: [ 'reference' ],
	name: 'glossary',
	title: 'Glossary',
	markdown: require( './glossary.md' ),
} );

addStory( {
	parents: [ 'reference' ],
	name: 'design-principles',
	title: 'Design Principles',
	markdown: require( './design.md' ),
} );

addStory( {
	parents: [ 'reference' ],
	name: 'coding-guidelines',
	title: 'Coding Guidelines',
	markdown: require( './coding-guidelines.md' ),
} );

addStory( {
	parents: [ 'reference' ],
	name: 'faq',
	title: 'Frequently Asked Questions',
	markdown: require( './faq.md' ),
} );
