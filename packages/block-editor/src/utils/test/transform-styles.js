/**
 * Internal dependencies
 */
import transformStyles from '../transform-styles';

it( 'should wrap selectors inside container queries', () => {
	const input = `
	@container (width > 400px) {
		  h1 { color: red; }
	}`;
	const output = transformStyles( { input: { css: input } }, 'my-namespace' );

	expect( output ).toEqual( [
		`
	@container (width > 400px) {
		  .my-namespace h1 { color: red; }
	}`,
	] );
} );
