/**
 * External dependencies
 */
import * as fun from 'lib0/function';

export { mergeBlocks } from './crdt-blocks';

export type SetValueFunction< ValueType = unknown > = (
	value: ValueType
) => ValueType;

export function mergePrimitiveValue< ValueType = unknown >(
	currentValue: ValueType,
	newValue: ValueType,
	setValue: SetValueFunction< ValueType >,
	_origin: string // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
	if ( ! fun.equalityDeep( currentValue, newValue ) ) {
		setValue( newValue );
	}
}
