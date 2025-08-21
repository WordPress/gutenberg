/**
 * External dependencies
 */
import * as fun from 'lib0/function';

/**
 * WordPress dependencies
 */
import { type CRDTDoc, Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { mergeBlocks, type Block, type YBlock } from './crdt-blocks';

type PrimitiveValue = string | number | boolean | null | undefined;

interface PostChanges {
	blocks?: Y.Array< YBlock > | Block[];
	title?: string | { raw: string };
}

export function defaultApplyChangesToCRDTDoc(
	ydoc: CRDTDoc,
	changes: PostChanges,
	origin: string
): void {
	const ymap = ydoc.getMap( 'document' );

	Object.entries( changes ).forEach( ( [ key, newValue ] ) => {
		// Return .get() result so that caller can operate on the data type
		// without having to call .get() themselves.
		function setValue< T = unknown >( updatedValue: T ): T {
			ymap.set( key, updatedValue );
			return ymap.get( key ) as T;
		}

		switch ( key ) {
			case 'blocks': {
				let currentBlocks = ymap.get(
					'blocks'
				) as PostChanges[ 'blocks' ];

				if ( ! ( currentBlocks instanceof Y.Array ) ) {
					currentBlocks = setValue< Y.Array< YBlock > >(
						new Y.Array()
					); // Initialize
				}

				// Block[] from local changes or Y.Array< Y.Map > from peer.
				const newBlocks = newValue ?? [];

				// Merge blocks does not need `setValue` because it has been
				// called above and the result can be operated on directly.
				mergeBlocks( currentBlocks, newBlocks, origin );
				break;
			}

			case 'title': {
				const currentValue = ymap.get(
					'title'
				) as PostChanges[ 'title' ];

				// Copy logic from prePersistPostType to ensure that the "Auto
				// Draft" template title is not synced.
				let rawNewValue = newValue?.raw ?? newValue;
				if ( ! currentValue && 'Auto Draft' === rawNewValue ) {
					rawNewValue = '';
				}

				mergePrimitiveValue( currentValue, rawNewValue, setValue );
				break;
			}

			// Add support for additional data types here.

			default: {
				const currentValue = ymap.get( key );
				mergePrimitiveValue( currentValue, newValue, setValue );
			}
		}
	} );
}

export function mergePrimitiveValue< ValueType extends PrimitiveValue >(
	currentValue: ValueType,
	newValue: ValueType,
	setValue: ( value: ValueType ) => ValueType
): void {
	if ( ! fun.equalityDeep( currentValue, newValue ) ) {
		setValue( newValue );
	}
}
