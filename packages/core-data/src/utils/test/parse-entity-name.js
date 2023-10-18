/**
 * Internal dependencies
 */
import parseEntityName from '../parse-entity-name';

describe( 'parseEntityName', () => {
	test.each( [
		{
			name: null,
			expected: { name: null, key: undefined, isRevision: false },
		},
		{
			name: 'name',
			expected: { name: 'name', key: undefined, isRevision: false },
		},
		{
			name: 'name|32',
			expected: { name: 'name|32', key: undefined, isRevision: false },
		},
		{
			name: 'name:23',
			expected: { name: 'name', key: '23', isRevision: false },
		},
		{
			name: 'name:23:revisions',
			expected: { name: 'name', key: '23', isRevision: true },
		},
	] )(
		'should return expected object when name is $name',
		( { name, expected } ) => {
			expect( parseEntityName( name ) ).toEqual( expected );
		}
	);
} );
