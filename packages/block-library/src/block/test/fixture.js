export const getReusableBlock = ( id ) => ( {
	content: {
		raw: `
    <!-- wp:heading -->
    <h2>First Reusable block</h2>
    <!-- /wp:heading -->
    
    <!-- wp:paragraph -->
    <p><strong>Bold</strong> <em>Italic</em> <s>Striked</s> Superscript<sup>(1)</sup> Subscript<sub>(2)</sub> <a href="http://www.wordpress.org" target="_blank" rel="noreferrer noopener">Link</a></p>
    <!-- /wp:paragraph -->
    
    !-- wp:heading {"level":4} -->
    <h4>List</h4>
    <!-- /wp:heading -->
    
    <!-- wp:list -->
    <ul><li>First Item</li><li>Second Item</li><li>Third Item</li></ul>
    <!-- /wp:list -->
`,
	},
	id,
	title: { raw: `Reusable block - ${ id }` },
	type: 'wp_block',
} );
