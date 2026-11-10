import getNestedValue from './get-nested-value';

/**
 * How a block attribute value is merged when collaborators change it at the
 * same time.
 *
 * - `set`: The value is a list of unique strings or numbers, in no particular
 *   order. Each collaborator's additions and removals are all kept.
 */
export type BlockAttributeMergeStrategy = 'set';

type BlockAttributes = Record< string, unknown >;
type SetElement = string | number;

interface BlockWithAttributes {
	attributes: BlockAttributes;
	innerBlocks?: BlockWithAttributes[];
}

// Separates the path from the element in the name of a set element key.
const SET_KEY_SEPARATOR = '#';

interface Registration {
	strategy: BlockAttributeMergeStrategy;
	// Property names of the path, e.g. `[ 'metadata', 'noteId' ]`.
	segments: string[];
}

// Registered paths. All of them use the `set` strategy, the only one so far.
const registrations = new Map< string, Registration >();

/**
 * Declare how a block attribute value is merged when collaborators change it
 * at the same time during real-time collaboration.
 *
 * By default, a block attribute is stored in the shared document as one
 * value. When two collaborators write it at the same time, one write replaces
 * the other.
 *
 * With the `set` strategy, each element of the list is stored under its own
 * key next to the block's attributes, e.g. `metadata.noteId#12`. Two
 * collaborators who add different elements write different keys, so the
 * shared document keeps both without running any code. Removing an element
 * deletes only its key. The block editor still sees a single list, sorted so
 * that it is the same for every collaborator.
 *
 * Every collaborator must register the same paths. Register them when the
 * editor loads, before a post is opened.
 *
 * @example
 * ```js
 * registerBlockAttributeMergeStrategy( 'metadata.noteId', 'set' );
 * ```
 *
 * @param path     Dot-separated path that starts with the attribute name,
 *                 e.g. `metadata.noteId`.
 * @param strategy How to merge the value at the path.
 * @return Function that removes the registration.
 */
export function registerBlockAttributeMergeStrategy(
	path: string,
	strategy: BlockAttributeMergeStrategy
): () => void {
	registrations.set( path, { strategy, segments: path.split( '.' ) } );

	return () => {
		registrations.delete( path );
	};
}

function isRecord( value: unknown ): value is Record< string, unknown > {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

function isSetElement( value: unknown ): value is SetElement {
	return typeof value === 'string' || typeof value === 'number';
}

// Orders set elements the same way for every collaborator. The locale is
// fixed so that the order does not depend on the language of the browser, and
// `numeric` puts 3 before 12.
const setElementCollator = new Intl.Collator( 'en', { numeric: true } );

/**
 * Whether a value can be stored as a set: a list of strings or numbers.
 *
 * @param value Value at a registered path.
 * @return True when the value is a list of strings or numbers.
 */
function isSetElementList( value: unknown ): value is SetElement[] {
	return Array.isArray( value ) && value.every( isSetElement );
}

/**
 * Return a copy of an object with the value at a path replaced. An undefined
 * replacement removes the property, and with it any parent left empty.
 *
 * @param object   Object to copy.
 * @param path     Property names to follow.
 * @param newValue Value to set at the path.
 * @return The updated copy.
 */
function setValueAtPath(
	object: Record< string, unknown >,
	path: string[],
	newValue: unknown
): Record< string, unknown > {
	const [ key, ...rest ] = path;
	const copy = { ...object };
	let child = newValue;

	if ( rest.length > 0 ) {
		let parent = {};
		const current = copy[ key ];
		if ( isRecord( current ) ) {
			parent = current;
		}

		const updated = setValueAtPath( parent, rest, newValue );
		child = updated;
		if ( newValue === undefined && Object.keys( updated ).length === 0 ) {
			child = undefined;
		}
	}

	if ( child === undefined ) {
		delete copy[ key ];
	} else {
		copy[ key ] = child;
	}

	return copy;
}

/**
 * Convert block attributes from the shape the block editor holds to the shape
 * stored in the shared document. Each element of a registered set moves out of
 * its attribute and becomes its own key.
 *
 * @param attributes Block attributes from the block editor.
 * @return Block attributes to store in the shared document.
 */
export function expandAttributeSets(
	attributes: BlockAttributes
): BlockAttributes {
	let result = attributes;

	for ( const [ path, { segments } ] of registrations ) {
		// Leave a value alone when it is not a list of strings or numbers.
		const elements = getNestedValue( result, segments );
		if ( ! isSetElementList( elements ) ) {
			continue;
		}

		result = setValueAtPath( result, segments, undefined );
		for ( const element of elements ) {
			result[ path + SET_KEY_SEPARATOR + element ] = element;
		}
	}

	return result;
}

/**
 * Convert block attributes from the shape stored in the shared document to the
 * shape the block editor holds. This is the inverse of `expandAttributeSets`.
 *
 * @param attributes Block attributes from the shared document.
 * @return Block attributes for the block editor.
 */
export function collapseAttributeSets(
	attributes: BlockAttributes
): BlockAttributes {
	let result = attributes;

	for ( const [ path, { segments } ] of registrations ) {
		const prefix = path + SET_KEY_SEPARATOR;
		const keys = Object.keys( result ).filter( ( key ) =>
			key.startsWith( prefix )
		);
		if ( keys.length === 0 ) {
			continue;
		}

		// The shared document is not validated, so skip unexpected values.
		const elements = keys
			.map( ( key ) => result[ key ] )
			.filter( isSetElement );

		// A list inside the attribute was written before the path was
		// registered, or by a collaborator who has not registered it. Keep
		// its elements too. The next local change moves them to their own keys.
		let embedded: SetElement[] = [];
		const current = getNestedValue( result, segments );
		if ( isSetElementList( current ) ) {
			embedded = current;
		}

		result = { ...result };
		for ( const key of keys ) {
			delete result[ key ];
		}

		result = setValueAtPath(
			result,
			segments,
			[ ...new Set( [ ...embedded, ...elements ] ) ].sort( ( a, b ) =>
				setElementCollator.compare( String( a ), String( b ) )
			)
		);
	}

	return result;
}

/**
 * Apply `collapseAttributeSets` to a list of blocks and their inner blocks.
 *
 * @param blocks Blocks as read from the shared document.
 * @return Blocks for the block editor.
 */
export function collapseAttributeSetsInBlocks<
	BlockType extends BlockWithAttributes,
>( blocks: BlockType[] ): BlockType[] {
	if ( registrations.size === 0 ) {
		return blocks;
	}

	return blocks.map( ( block ) => ( {
		...block,
		attributes: collapseAttributeSets( block.attributes ?? {} ),
		innerBlocks: collapseAttributeSetsInBlocks( block.innerBlocks ?? [] ),
	} ) );
}
