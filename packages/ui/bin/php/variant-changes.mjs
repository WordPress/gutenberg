/**
 * Compacting a component's renders into one base render plus what each
 * variant value changes, so PHP doesn't need a full snapshot per combination.
 *
 * Most variants only add or remove classes, or set attributes and inline
 * styles, and those changes combine: Button comes down to a base render and
 * 7 changes. The changes come from one render per variant value. The parity
 * tests check every combination against React, so a variant that changes the
 * structure, or props that interact, show up there.
 */

// A slot placeholder in rendered HTML, such as `__wpuislot_content__`.
export const SLOT_PATTERN = /__wpuislot_([a-z0-9_]+)__/;

/**
 * Marks each placeholder with where it is, so PHP knows how to escape what it
 * fills in: `__wpuislot_label__text__` in text, `__wpuislot_type__attr_type__`
 * in the `type` attribute.
 *
 * @param {string} html Rendered HTML with placeholders.
 * @return {string} HTML.
 */
export function markPlaceholderContext( html ) {
	return html.replace(
		new RegExp( SLOT_PATTERN.source, 'g' ),
		( match, slot, offset ) => {
			const before = html.slice( 0, offset );
			const inTag = before.lastIndexOf( '<' ) > before.lastIndexOf( '>' );
			const attribute = inTag
				? before.match( /([^\s=<]+)="[^"]*$/ )?.[ 1 ]
				: null;
			return attribute
				? `${ match }attr_${ attribute }__`
				: `${ match }text__`;
		}
	);
}

/**
 * Splits HTML into start tags (with their attributes) and everything else, as
 * strings. Start tags are counted the way `WP_HTML_Tag_Processor::next_tag()`
 * visits them, which is how PHP finds the tag a change applies to.
 *
 * @param {string} html HTML.
 * @return {Array} Tokens.
 */
function tokenize( html ) {
	const tokens = [];
	const pattern =
		/<([a-z][a-z0-9-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*\/?>|<\/[^>]+>|[^<]+/gi;
	for ( const match of html.matchAll( pattern ) ) {
		if ( ! match[ 1 ] ) {
			tokens.push( match[ 0 ] );
			continue;
		}
		const attributes = new Map();
		for ( const attribute of match[ 2 ].matchAll(
			/([^\s=]+)(?:="([^"]*)")?/g
		) ) {
			attributes.set( attribute[ 1 ], attribute[ 2 ] ?? '' );
		}
		tokens.push( { tag: match[ 1 ], attributes } );
	}
	return tokens;
}

const toClasses = ( value ) =>
	new Set( ( value ?? '' ).split( /\s+/ ).filter( Boolean ) );

const toStyles = ( value ) =>
	new Map(
		( value ?? '' )
			.split( ';' )
			.filter( Boolean )
			.map( ( declaration ) =>
				declaration.split( /:(.*)/s ).slice( 0, 2 )
			)
	);

/**
 * What changes between two renders with the same structure, per start tag.
 *
 * @param {Array} base  Tokens of the base render.
 * @param {Array} other Tokens of another render.
 * @return {Array|null} Changes, or null when the structure differs.
 */
function diff( base, other ) {
	if ( base.length !== other.length ) {
		return null;
	}

	const changes = [];
	let tag = -1;
	for ( let i = 0; i < base.length; i++ ) {
		const a = base[ i ];
		const b = other[ i ];
		if ( typeof a === 'string' || typeof b === 'string' ) {
			if ( a !== b ) {
				return null;
			}
			continue;
		}
		tag++;
		if ( a.tag !== b.tag ) {
			return null;
		}

		const change = { tag };
		const classesA = toClasses( a.attributes.get( 'class' ) );
		const classesB = toClasses( b.attributes.get( 'class' ) );
		const addClass = [ ...classesB ].filter( ( c ) => ! classesA.has( c ) );
		const removeClass = [ ...classesA ].filter(
			( c ) => ! classesB.has( c )
		);
		if ( addClass.length ) {
			change.addClass = addClass;
		}
		if ( removeClass.length ) {
			change.removeClass = removeClass;
		}

		const stylesA = toStyles( a.attributes.get( 'style' ) );
		const stylesB = toStyles( b.attributes.get( 'style' ) );
		const style = {};
		for ( const [ property, value ] of stylesB ) {
			if ( stylesA.get( property ) !== value ) {
				style[ property ] = value;
			}
		}
		for ( const property of stylesA.keys() ) {
			if ( ! stylesB.has( property ) ) {
				style[ property ] = null;
			}
		}
		if ( Object.keys( style ).length ) {
			change.style = style;
		}

		const set = {};
		for ( const [ name, value ] of b.attributes ) {
			if (
				name !== 'class' &&
				name !== 'style' &&
				a.attributes.get( name ) !== value
			) {
				set[ name ] = value;
			}
		}
		const remove = [ ...a.attributes.keys() ].filter(
			( name ) =>
				name !== 'class' &&
				name !== 'style' &&
				! b.attributes.has( name )
		);
		if ( Object.keys( set ).length ) {
			change.set = set;
		}
		if ( remove.length ) {
			change.remove = remove;
		}

		if ( Object.keys( change ).length > 1 ) {
			changes.push( change );
		}
	}
	return changes;
}

/**
 * Applies changes to tokens, in the same order PHP does.
 *
 * @param {Array} tokens  Tokens of the base render.
 * @param {Array} changes Changes, possibly from several variants.
 * @return {Array} New tokens.
 */
function apply( tokens, changes ) {
	const starts = [];
	const result = tokens.map( ( token ) => {
		if ( typeof token === 'string' ) {
			return token;
		}
		const copy = {
			tag: token.tag,
			attributes: new Map( token.attributes ),
		};
		starts.push( copy );
		return copy;
	} );

	for ( const change of changes ) {
		const { attributes } = starts[ change.tag ];
		if ( change.removeClass || change.addClass ) {
			const classes = toClasses( attributes.get( 'class' ) );
			change.removeClass?.forEach( ( c ) => classes.delete( c ) );
			change.addClass?.forEach( ( c ) => classes.add( c ) );
			attributes.set( 'class', [ ...classes ].join( ' ' ) );
		}
		if ( change.style ) {
			const styles = toStyles( attributes.get( 'style' ) );
			for ( const [ property, value ] of Object.entries(
				change.style
			) ) {
				if ( value === null ) {
					styles.delete( property );
				} else {
					styles.set( property, value );
				}
			}
			attributes.set(
				'style',
				[ ...styles ].map( ( [ p, v ] ) => `${ p }:${ v }` ).join( ';' )
			);
		}
		for ( const [ name, value ] of Object.entries( change.set ?? {} ) ) {
			attributes.set( name, value );
		}
		change.remove?.forEach( ( name ) => attributes.delete( name ) );
	}
	return result;
}

/**
 * Turns a component's renders into a base render, the changes per variant
 * value, and full snapshots for the combinations those don't rebuild.
 *
 * @param {Array}  variants Variants, as `{ prop, values }`.
 * @param {Object} defaults Default value per variant prop.
 * @param {Map}    renders  Render per snapshot key, as `{ combination, html }`.
 * @return {Object} `{ base, changes, exceptions }`, with HTML strings whose
 *         placeholders are marked with their context.
 */
export function compileVariantChanges( variants, defaults, renders ) {
	const html = new Map(
		[ ...renders ].map( ( [ key, render ] ) => [
			key,
			markPlaceholderContext( render.html ),
		] )
	);
	const keyOf = ( combination ) =>
		variants
			.map( ( { prop } ) => `${ prop }=${ combination[ prop ] }` )
			.join( '&' );

	const baseKey = keyOf( defaults );
	const base = tokenize( html.get( baseKey ) );

	// What each value changes on its own, compared to the defaults.
	const changes = {};
	for ( const { prop, values } of variants ) {
		for ( const value of values ) {
			if ( value === defaults[ prop ] ) {
				continue;
			}
			const tokens = tokenize(
				html.get( keyOf( { ...defaults, [ prop ]: value } ) )
			);
			const change = diff( base, tokens );
			if ( change?.length ) {
				changes[ `${ prop }=${ value }` ] = change;
			} else if ( change === null ) {
				changes[ `${ prop }=${ value }` ] = null;
			}
		}
	}

	// Check every combination, and keep the ones the changes don't rebuild.
	const exceptions = {};
	for ( const [ key, { combination } ] of renders ) {
		const used = variants
			.filter( ( { prop } ) => combination[ prop ] !== defaults[ prop ] )
			.map(
				( { prop } ) => changes[ `${ prop }=${ combination[ prop ] }` ]
			)
			.filter( ( change ) => change !== undefined );
		const rebuilt = used.includes( null )
			? null
			: apply( base, used.flat() );
		const actual = tokenize( html.get( key ) );
		if ( ! rebuilt || diff( rebuilt, actual )?.length !== 0 ) {
			exceptions[ key ] = html.get( key );
		}
	}

	return {
		base: html.get( baseKey ),
		changes: Object.fromEntries(
			Object.entries( changes ).filter( ( [ , change ] ) => change )
		),
		exceptions,
	};
}
