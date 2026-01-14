/**
 * Internal dependencies
 */
import {
	generateCallId,
	createCallMessage,
	createResultMessage,
	createErrorMessage,
	isRPCMessage,
	postRPCMessage,
} from '../rpc';
import { MessageType } from '../types';

describe( 'rpc', () => {
	describe( 'generateCallId', () => {
		it( 'should return incrementing unique IDs', () => {
			const id1 = generateCallId();
			const id2 = generateCallId();
			const id3 = generateCallId();

			expect( id2 ).toBe( id1 + 1 );
			expect( id3 ).toBe( id2 + 1 );
		} );

		it( 'should return numeric IDs', () => {
			const id = generateCallId();
			expect( typeof id ).toBe( 'number' );
		} );
	} );

	describe( 'createCallMessage', () => {
		it( 'should create a CALL message with correct structure', () => {
			const message = createCallMessage( 1, 'testMethod', [ 'arg1', 2 ] );

			expect( message ).toEqual( {
				type: MessageType.CALL,
				id: 1,
				method: 'testMethod',
				args: [ 'arg1', 2 ],
			} );
		} );

		it( 'should handle empty args array', () => {
			const message = createCallMessage( 5, 'noArgs', [] );

			expect( message.args ).toEqual( [] );
		} );

		it( 'should handle complex argument types', () => {
			const complexArg = { nested: { value: true }, arr: [ 1, 2, 3 ] };
			const message = createCallMessage( 1, 'complex', [ complexArg ] );

			expect( message.args[ 0 ] ).toEqual( complexArg );
		} );
	} );

	describe( 'createResultMessage', () => {
		it( 'should create a RESULT message with correct structure', () => {
			const message = createResultMessage( 42, 'success' );

			expect( message ).toEqual( {
				type: MessageType.RESULT,
				id: 42,
				result: 'success',
			} );
		} );

		it( 'should handle null result', () => {
			const message = createResultMessage( 1, null );
			expect( message.result ).toBeNull();
		} );

		it( 'should handle undefined result', () => {
			const message = createResultMessage( 1, undefined );
			expect( message.result ).toBeUndefined();
		} );

		it( 'should handle object result', () => {
			const result = { data: [ 1, 2, 3 ], status: 'ok' };
			const message = createResultMessage( 1, result );
			expect( message.result ).toEqual( result );
		} );
	} );

	describe( 'createErrorMessage', () => {
		it( 'should extract message, name, and stack from Error instances', () => {
			const error = new Error( 'Test error' );
			error.name = 'TestError';
			const message = createErrorMessage( 1, error );

			expect( message ).toEqual( {
				type: MessageType.ERROR,
				id: 1,
				error: {
					message: 'Test error',
					name: 'TestError',
					stack: error.stack,
				},
			} );
		} );

		it( 'should handle TypeError', () => {
			const error = new TypeError( 'Type error message' );
			const message = createErrorMessage( 2, error );

			expect( message.error.name ).toBe( 'TypeError' );
			expect( message.error.message ).toBe( 'Type error message' );
		} );

		it( 'should convert non-Error values to string', () => {
			const message = createErrorMessage( 1, 'string error' );

			expect( message.error ).toEqual( {
				message: 'string error',
			} );
		} );

		it( 'should handle number as error', () => {
			const message = createErrorMessage( 1, 404 );
			expect( message.error.message ).toBe( '404' );
		} );

		it( 'should handle object as error', () => {
			const message = createErrorMessage( 1, { code: 'ERR' } );
			expect( message.error.message ).toBe( '[object Object]' );
		} );
	} );

	describe( 'isRPCMessage', () => {
		describe( 'non-object values', () => {
			it( 'should return false for null', () => {
				expect( isRPCMessage( null ) ).toBe( false );
			} );

			it( 'should return false for undefined', () => {
				expect( isRPCMessage( undefined ) ).toBe( false );
			} );

			it( 'should return false for primitives', () => {
				expect( isRPCMessage( 'string' ) ).toBe( false );
				expect( isRPCMessage( 123 ) ).toBe( false );
				expect( isRPCMessage( true ) ).toBe( false );
			} );
		} );

		describe( 'invalid structure', () => {
			it( 'should return false for objects without type', () => {
				expect( isRPCMessage( { id: 1 } ) ).toBe( false );
			} );

			it( 'should return false for objects without id', () => {
				expect( isRPCMessage( { type: 1 } ) ).toBe( false );
			} );

			it( 'should return false for non-numeric type', () => {
				expect( isRPCMessage( { type: 'CALL', id: 1 } ) ).toBe( false );
			} );

			it( 'should return false for non-numeric id', () => {
				expect( isRPCMessage( { type: 1, id: '1' } ) ).toBe( false );
			} );
		} );

		describe( 'CALL messages', () => {
			it( 'should return true for valid CALL message', () => {
				const message = {
					type: MessageType.CALL,
					id: 1,
					method: 'test',
					args: [],
				};
				expect( isRPCMessage( message ) ).toBe( true );
			} );

			it( 'should return false if method is not a string', () => {
				const message = {
					type: MessageType.CALL,
					id: 1,
					method: 123,
					args: [],
				};
				expect( isRPCMessage( message ) ).toBe( false );
			} );

			it( 'should return false if args is not an array', () => {
				const message = {
					type: MessageType.CALL,
					id: 1,
					method: 'test',
					args: 'not-array',
				};
				expect( isRPCMessage( message ) ).toBe( false );
			} );
		} );

		describe( 'RESULT messages', () => {
			it( 'should return true for valid RESULT message', () => {
				const message = {
					type: MessageType.RESULT,
					id: 1,
					result: 'value',
				};
				expect( isRPCMessage( message ) ).toBe( true );
			} );

			it( 'should return true when result is null', () => {
				const message = {
					type: MessageType.RESULT,
					id: 1,
					result: null,
				};
				expect( isRPCMessage( message ) ).toBe( true );
			} );

			it( 'should return true when result is undefined', () => {
				const message = {
					type: MessageType.RESULT,
					id: 1,
					result: undefined,
				};
				expect( isRPCMessage( message ) ).toBe( true );
			} );
		} );

		describe( 'ERROR messages', () => {
			it( 'should return true for valid ERROR message', () => {
				const message = {
					type: MessageType.ERROR,
					id: 1,
					error: { message: 'error text' },
				};
				expect( isRPCMessage( message ) ).toBe( true );
			} );

			it( 'should return false if error is not an object', () => {
				const message = {
					type: MessageType.ERROR,
					id: 1,
					error: 'string error',
				};
				expect( isRPCMessage( message ) ).toBe( false );
			} );

			it( 'should return false if error.message is not a string', () => {
				const message = {
					type: MessageType.ERROR,
					id: 1,
					error: { message: 123 },
				};
				expect( isRPCMessage( message ) ).toBe( false );
			} );
		} );

		describe( 'unknown message types', () => {
			it( 'should return false for unknown type', () => {
				const message = {
					type: 999,
					id: 1,
				};
				expect( isRPCMessage( message ) ).toBe( false );
			} );
		} );
	} );

	describe( 'postRPCMessage', () => {
		it( 'should call postMessage on target with message and transferables', () => {
			const mockPostMessage = jest.fn();
			const target = { postMessage: mockPostMessage };
			const message = createResultMessage( 1, 'test' );

			postRPCMessage( target as unknown as Worker, message );

			expect( mockPostMessage ).toHaveBeenCalledWith( message, [] );
		} );

		it( 'should detect ArrayBuffer transferables', () => {
			const mockPostMessage = jest.fn();
			const target = { postMessage: mockPostMessage };
			const buffer = new ArrayBuffer( 8 );
			const message = createResultMessage( 1, buffer );

			postRPCMessage( target as unknown as Worker, message );

			expect( mockPostMessage ).toHaveBeenCalledWith( message, [
				buffer,
			] );
		} );

		it( 'should handle target without postMessage gracefully', () => {
			const target = {};

			expect( () => {
				postRPCMessage(
					target as unknown as Worker,
					createResultMessage( 1, 'test' )
				);
			} ).not.toThrow();
		} );
	} );
} );
