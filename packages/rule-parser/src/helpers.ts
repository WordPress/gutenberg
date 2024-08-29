/**
 * Internal dependencies
 */
import type { Value, RawRule, Rule, Rules, StrictRules } from './types';
import { combinators } from './constants';

function isPrimitive( value: unknown ): value is Value {
	return (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	);
}

function isPrimitiveArray( value: unknown ): value is Array< Value > {
	if ( ! Array.isArray( value ) ) {
		return false;
	}
	const type = typeof value[ 0 ];
	return value.every( ( item ) => typeof item === type );
}

export function valueType( value: Value | Value[] ): string {
	return Array.isArray( value ) ? typeof value[ 0 ] : typeof value;
}

export function isRawRule( rule: unknown ): rule is RawRule {
	if ( ! Array.isArray( rule ) ) {
		return false;
	}

	if ( rule.length !== 3 ) {
		return false;
	}

	const [ source, operator, target ] = rule;

	if ( typeof source !== 'string' ) {
		return false;
	}

	if ( typeof operator !== 'string' ) {
		return false;
	}

	if ( ! isPrimitive( target ) && ! isPrimitiveArray( target ) ) {
		return false;
	}

	return true;
}

export function isRule( rule: unknown ): rule is Rule {
	if ( ! Array.isArray( rule ) ) {
		return false;
	}

	if ( rule.length !== 3 ) {
		return false;
	}

	const [ source, operator, target ] = rule;

	if ( ! isPrimitive( source ) && ! isPrimitiveArray( source ) ) {
		return false;
	}

	if ( typeof operator !== 'string' ) {
		return false;
	}

	if ( ! isPrimitive( target ) && ! isPrimitiveArray( target ) ) {
		return false;
	}

	return true;
}

export function stringifyRule( rule: Rule ): string {
	const [ source, operator, target ] = rule;
	const sourceString = Array.isArray( source )
		? `[ ${ source.join( ', ' ) } ]`
		: source;
	const targetString = Array.isArray( target )
		? `[ ${ target.join( ', ' ) } ]`
		: target;

	return `[ ${ sourceString } ${ operator } ${ targetString } ]`;
}

export function isStructuredRule< T extends Rule | boolean >(
	rules: Rules< T >
): rules is StrictRules< T > {
	return (
		Array.isArray( rules ) &&
		typeof rules[ 0 ] === 'string' &&
		combinators.includes( rules[ 0 ] )
	);
}
