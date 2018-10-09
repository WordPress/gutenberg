/**
 * Internal dependencies
 */
import traverse from '../../traverse';
import editorWidth from '../editor-width';

describe( 'Editor Width', () => {
	it( 'should only replace the html declaration', () => {
		const input = `h1 { width: 300px; }`;
		const output = traverse( input, editorWidth );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should generate the editor width styles', () => {
		const input = `.wp-block { width: 300px; }`;
		const output = traverse( input, editorWidth );

		expect( output ).toMatchSnapshot();
	} );
} );
