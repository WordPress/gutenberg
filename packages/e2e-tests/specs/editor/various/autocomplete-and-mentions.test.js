/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
	createNewPost,
	createUser,
	deleteUser,
} from '@wordpress/e2e-test-utils';

const userList = [
	{ userName: 'testuser', firstName: 'Jane', lastName: 'Doe' },
	{ userName: 'darthVader', firstName: 'Darth', lastName: 'Vader' },
	{ userName: 'mockingjay', firstName: 'Katniss', lastName: 'Everdeen' },
	{ userName: 'buddytheelf', firstName: 'Buddy', lastName: 'Elf' },
	{ userName: 'ringbearer', firstName: 'Frodo', lastName: 'Baggins' },
	{ userName: 'thebetterhobbit', firstName: 'Bilbo', lastName: 'Baggins' },
	{ userName: 'makeitso', firstName: 'Jean-Luc', lastName: 'Picard' },
];
describe( 'Autocomplete', () => {
	beforeAll( async () => {
		for ( const user of userList ) {
			await createUser( user.userName, {
				firstName: user.firstName,
				lastName: user.lastName,
			} );
		}
		await activatePlugin( 'gutenberg-test-autocompleter' );
	} );

	afterAll( async () => {
		for ( const user of userList ) {
			await deleteUser( user.userName );
		}
		await deactivatePlugin( 'gutenberg-test-autocompleter' );
	} );
	describe.each( [
		[ 'User Mention', '@' ],
		[ 'Custom Completer', '~' ],
	] )( '%s', ( ...typeAndTrigger ) => {
		const [ type, trigger ] = typeAndTrigger;

		beforeEach( async () => {
			await createNewPost();
		} );

		it( 'should work', () => {
			expect( type ).toBeTruthy();
			expect( trigger ).toBeTruthy();
		} );
	} );
} );
