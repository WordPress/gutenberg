/**
 * Internal dependencies
 */
import createBatch from '../create-batch';

describe( 'createBatch', () => {
	test( 'running an empty batch', async () => {
		const processor = async ( inputs ) => inputs;
		const batch = createBatch( processor );
		expect( await batch.run() ).toBe( true );
	} );

	test( 'running resolves promises when processor returns output', async () => {
		const processor = async ( inputs ) =>
			inputs.map( ( input ) => ( {
				output: input,
			} ) );
		const batch = createBatch( processor );
		let promise1Value, promise2Value;
		batch.add( 1 ).then( ( value ) => ( promise1Value = value ) );
		batch.add( 2 ).then( ( value ) => ( promise2Value = value ) );
		expect( await batch.run() ).toBe( true );
		expect( promise1Value ).toBe( 1 );
		expect( promise2Value ).toBe( 2 );
	} );

	test( 'running resolves promises when processor returns non-objects', async () => {
		const processor = async ( inputs ) => inputs.map( ( input ) => input );
		const batch = createBatch( processor );
		let promise1Value, promise2Value;
		batch.add( 1 ).then( ( value ) => ( promise1Value = value ) );
		batch.add( 2 ).then( ( value ) => ( promise2Value = value ) );
		expect( await batch.run() ).toBe( true );
		expect( promise1Value ).toBe( 1 );
		expect( promise2Value ).toBe( 2 );
	} );

	test( 'running waits for all thunks to finish', async () => {
		const processor = async ( inputs ) =>
			inputs.map( ( input ) => ( {
				output: input,
			} ) );
		const batch = createBatch( processor );
		let promise1Value, promise2Value;
		batch.add( async ( add ) => {
			await Promise.resolve(); // Simulates a delay.
			return add( 1 ).then( ( value ) => ( promise1Value = value ) );
		} );
		batch.add( async ( add ) => {
			await Promise.resolve(); // Simulates a delay.
			return add( 2 ).then( ( value ) => ( promise2Value = value ) );
		} );
		expect( await batch.run() ).toBe( true );
		expect( promise1Value ).toBe( 1 );
		expect( promise2Value ).toBe( 2 );
	} );

	test( "running doesn't time out when a thunk doesn't call add()", async () => {
		const processor = async ( inputs ) =>
			inputs.map( ( input ) => ( {
				output: input,
			} ) );
		const batch = createBatch( processor );
		batch.add( async () => {
			await Promise.resolve(); // Simulates a delay.
		} );
		batch.add( () => {
			// No delay.
		} );
		expect( await batch.run() ).toBe( true );
	} );

	test( 'running resets the batch when finished', async () => {
		const processor = jest.fn( async ( inputs ) =>
			inputs.map( ( input ) => ( {
				output: input,
			} ) )
		);
		const batch = createBatch( processor );
		let promise1Value;
		batch.add( 1 ).then( ( value ) => ( promise1Value = value ) );
		expect( await batch.run() ).toBe( true );
		expect( promise1Value ).toBe( 1 );
		expect( processor ).toHaveBeenCalledTimes( 1 );
		expect( processor ).toHaveBeenCalledWith( [ 1 ] );
		let promise2Value;
		batch.add( 2 ).then( ( value ) => ( promise2Value = value ) );
		expect( await batch.run() ).toBe( true );
		expect( promise2Value ).toBe( 2 );
		expect( processor ).toHaveBeenCalledTimes( 2 );
		expect( processor ).toHaveBeenCalledWith( [ 2 ] );
	} );

	test( 'running rejects promises when processor returns errors', async () => {
		const processor = async ( inputs ) =>
			inputs.map( ( input ) => ( {
				error: input,
			} ) );
		const batch = createBatch( processor );
		let promise1Error, promise2Error;
		batch.add( 1 ).catch( ( error ) => ( promise1Error = error ) );
		batch.add( 2 ).catch( ( error ) => ( promise2Error = error ) );
		expect( await batch.run() ).toBe( false );
		expect( promise1Error ).toBe( 1 );
		expect( promise2Error ).toBe( 2 );
	} );

	test( 'running rejects promises and rethrows when processor throws', async () => {
		const processor = async () => {
			throw 'Jikes!';
		};
		const batch = createBatch( processor );
		let promise1Error, promise2Error;
		batch.add( 1 ).catch( ( error ) => ( promise1Error = error ) );
		batch.add( 2 ).catch( ( error ) => ( promise2Error = error ) );
		await expect( batch.run() ).rejects.toBe( 'Jikes!' );
		expect( promise1Error ).toBe( 'Jikes!' );
		expect( promise2Error ).toBe( 'Jikes!' );
	} );

	test( 'running rejects promises and throws when processor returns wrong length', async () => {
		const processor = async () => [ 1 ];
		const batch = createBatch( processor );
		let promise1Error, promise2Error;
		batch.add( 1 ).catch( ( error ) => ( promise1Error = error ) );
		batch.add( 2 ).catch( ( error ) => ( promise2Error = error ) );
		await expect( batch.run() ).rejects.toBeInstanceOf( Error );
		expect( promise1Error ).toBeInstanceOf( Error );
		expect( promise2Error ).toBeInstanceOf( Error );
	} );
} );
