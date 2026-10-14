/**
 * The PHP contract of a component, and the changes that would break it.
 */
import { createHash } from 'node:crypto';

/**
 * A short fingerprint of a component's markup, to tell when it changed.
 *
 * @param {string} snapshot The component's snapshot file contents.
 * @return {string} Fingerprint.
 */
export function getMarkupFingerprint( snapshot ) {
	return createHash( 'sha1' )
		.update( snapshot )
		.digest( 'hex' )
		.slice( 0, 12 );
}

/**
 * Summarizes a component's PHP contract: its props, their types and values.
 *
 * @param {Object} component Component definition.
 * @return {Object} Contract.
 */
export function getContract( component ) {
	return Object.fromEntries(
		Object.entries( component.props ).map( ( [ prop, schema ] ) => [
			prop,
			{
				type: schema.type,
				...( schema.enum && { enum: schema.enum } ),
				...( schema.required && { required: true } ),
			},
		] )
	);
}

/**
 * Lists the backward-incompatible changes between a released contract and
 * the current one, ignoring props and values that `deprecations` keep working.
 *
 * @param {string} name         Component name.
 * @param {Object} released     Contract of the last release.
 * @param {Object} current      Current contract.
 * @param {Array}  deprecations The component's deprecations.
 * @return {string[]} Problems.
 */
export function getBreakingChanges(
	name,
	released,
	current,
	deprecations = []
) {
	const isDeprecated = ( prop, value ) =>
		deprecations.some(
			( deprecation ) =>
				deprecation.prop === prop && deprecation.value === value
		);
	const problems = [];

	for ( const [ prop, schema ] of Object.entries( released ) ) {
		const now = current[ prop ];
		if ( ! now ) {
			if ( ! isDeprecated( prop, undefined ) ) {
				problems.push( `${ name }: the "${ prop }" prop was removed.` );
			}
			continue;
		}
		if ( now.type !== schema.type ) {
			problems.push(
				`${ name }: the "${ prop }" prop changed from ${ schema.type } to ${ now.type }.`
			);
		}
		for ( const value of schema.enum ?? [] ) {
			if (
				! now.enum?.includes( value ) &&
				! isDeprecated( prop, value )
			) {
				problems.push(
					`${ name }: the "${ value }" value of "${ prop }" was removed.`
				);
			}
		}
	}

	for ( const [ prop, schema ] of Object.entries( current ) ) {
		if ( schema.required && ! released[ prop ]?.required ) {
			problems.push( `${ name }: the "${ prop }" prop became required.` );
		}
	}

	return problems;
}
