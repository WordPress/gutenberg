import { autop, removep } from '@wordpress/autop';
import { getPhrasingContentSchema } from '@wordpress/dom';
import warning from '@wordpress/warning';
import { createBlock } from './factory';
import { matchesSelector } from './matches-selector';
import { getRawTransforms } from './raw-handling/get-raw-transforms';
import { nodeToBlock } from './raw-handling/html-to-blocks';
import {
	getBlockAttributes,
	isValidByEnum,
	isValidByType,
	parseWithAttributeSchema,
} from './parser/get-block-attributes';

type SchemaArgs = {
	phrasingContentSchema: Record< string, unknown >;
	isPaste: boolean;
};

type DeclarativeTransform = Record< string, any >;

/**
 * Token standing in for the phrasing content schema, which cannot be written
 * out in `block.json` because it is derived at runtime.
 */
const PHRASING_CONTENT_TOKEN = 'phrasing';

/**
 * Determines whether an `attributes` schema entry splits by paste context.
 *
 * @param value Value of an `attributes` key in a content schema.
 *
 * @return Whether the value declares separate paste and default attributes.
 */
function isContextualAttributeList( value: unknown ): boolean {
	return (
		!! value &&
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		( 'default' in value || 'paste' in value )
	);
}

/**
 * Resolves the tokens a declared content schema may use.
 *
 * `block.json` cannot hold the phrasing content schema or a paste check, so a
 * declared schema writes `"phrasing"` where the editor expects the phrasing
 * content schema, and `{ "default": [], "paste": [] }` where it varies the
 * allowed attributes by context.
 *
 * @param schema Declared content schema.
 * @param args   Schema arguments supplied by the raw handling pipeline.
 *
 * @return Content schema in the shape the editor expects.
 */
function resolveContentSchema( schema: unknown, args: SchemaArgs ): unknown {
	if ( PHRASING_CONTENT_TOKEN === schema ) {
		return args.phrasingContentSchema;
	}

	if ( ! schema || typeof schema !== 'object' || Array.isArray( schema ) ) {
		return schema;
	}

	return Object.fromEntries(
		Object.entries( schema ).map( ( [ key, value ] ) => {
			if ( 'attributes' === key && isContextualAttributeList( value ) ) {
				const contextual = value as Record< string, string[] >;
				return [
					key,
					( args.isPaste ? contextual.paste : contextual.default ) ??
						[],
				];
			}

			if (
				'attributes' === key ||
				'require' === key ||
				'classes' === key
			) {
				return [ key, value ];
			}

			return [ key, resolveContentSchema( value, args ) ];
		} )
	);
}

/**
 * Resolves the attribute values a transform declares.
 *
 * A value is used as given, unless it is an object declaring a `source`, in
 * which case it is read out of the matched markup the same way a block
 * attribute would be.
 *
 * @param overrides Declared attribute values.
 * @param node      Element the transform matched.
 *
 * @return Attribute values.
 */
function resolveAttributeOverrides(
	overrides: Record< string, unknown >,
	node: Element
): Record< string, unknown > {
	const attributes: Record< string, unknown > = {};

	Object.entries( overrides ).forEach( ( [ name, value ] ) => {
		const resolved = resolveAttributeValue( value, node );

		if ( resolved !== undefined ) {
			setAttributePath( attributes, name, resolved );
		}
	} );

	return attributes;
}

/**
 * Resolves one declared attribute value.
 *
 * @param value Declared value.
 * @param node  Element the transform matched.
 *
 * @return Attribute value, or undefined when the markup supplies none.
 */
function resolveAttributeValue( value: unknown, node: Element ): unknown {
	if (
		! value ||
		typeof value !== 'object' ||
		Array.isArray( value ) ||
		! ( 'source' in value )
	) {
		return value;
	}

	const declaration = value as DeclarativeTransform;

	let sourced =
		'style' === declaration.source
			? readStyleProperty(
					resolveSelectorTarget( node, declaration.selector ),
					declaration.property
			  )
			: readSourcedValue( declaration, node );

	/*
	 * An HTML attribute is always a string. The server-side parser coerces a
	 * numeric one to the number its declared type asks for, so the editor has
	 * to as well — against the shared grammar, not `Number()`, whose looser
	 * one would accept what the server rejects.
	 */
	if (
		'attribute' === declaration.source &&
		( 'number' === declaration.type || 'integer' === declaration.type ) &&
		typeof sourced === 'string' &&
		NUMERIC_STRING.test( sourced )
	) {
		const coerced = Number( sourced );

		// A magnitude past the float range coerces to Infinity, which JSON
		// cannot write; the string stays and falls out as type-invalid.
		if ( Number.isFinite( coerced ) ) {
			sourced = coerced;
		}
	}

	/*
	 * A `map` turns a sourced value into one the block declares, such as a
	 * heading tag name into a heading level. The mapped value is validated
	 * below the same as a plain sourced one, as the server validates it.
	 */
	const lookup = declaration.map;
	if ( lookup && typeof lookup === 'object' ) {
		sourced = Object.prototype.hasOwnProperty.call(
			lookup,
			sourced as string
		)
			? lookup[ sourced as string ]
			: undefined;
	}

	// The block's own attributes are validated by `getBlockAttributes`; a
	// declared one is validated here, so that `type` and `enum` mean the same
	// thing wherever they are written.
	if (
		! isValidByType( sourced, declaration.type ) ||
		! isValidByEnum( sourced, declaration.enum )
	) {
		return undefined;
	}

	return sourced;
}

/**
 * The numeric grammar both runtimes share, so a declared `number` attribute
 * coerces identically wherever the conversion runs. Deliberately stricter
 * than `Number()` or PHP's `is_numeric()`: no surrounding whitespace, no
 * hex or binary notation, no `Infinity` — those differ between engines and
 * PHP versions, so accepting them would make the result depend on the
 * runtime.
 */
const NUMERIC_STRING = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Reads a declared attribute out of the matched markup.
 *
 * The declaration comes from a `block.json` file, so a source the editor does
 * not know, or a selector it cannot parse, is a mistake in that file rather
 * than a reason to throw out of every conversion.
 *
 * @param declaration Declared attribute.
 * @param node        Element the transform matched.
 *
 * @return Attribute value, or undefined when it cannot be read.
 */
function readSourcedValue(
	declaration: DeclarativeTransform,
	node: Element
): unknown {
	try {
		/*
		 * A source with no selector reads whatever it is handed, so the matched
		 * node is passed as-is: parsing its markup would hand the source the
		 * `<body>` hpq wraps it in instead. With a selector, the markup is
		 * parsed so the selector can match the node itself as well as its
		 * descendants, which is what the server-side parser does.
		 */
		return parseWithAttributeSchema(
			'selector' in declaration ? node.outerHTML : node,
			declaration as any
		);
	} catch {
		warning(
			`The "${ declaration.source }" attribute source declared by a block cannot be read, so the attribute is left unset.`
		);
		return undefined;
	}
}

/**
 * Resolves a declared selector against the matched element itself or a
 * descendant, the way the server-side parser resolves it.
 *
 * @param node     Element the transform matched.
 * @param selector Declared selector, if any.
 *
 * @return The element to read from, or null when the selector matches nothing.
 */
function resolveSelectorTarget(
	node: Element,
	selector: unknown
): Element | null {
	if ( typeof selector !== 'string' || '' === selector ) {
		return node;
	}

	if ( matchesSelector( node, selector ) ) {
		return node;
	}

	try {
		return node.querySelector( selector );
	} catch {
		return null;
	}
}

/**
 * Reads one declaration out of an element's inline styles.
 *
 * @param node     Element to read.
 * @param property CSS property name, as it is written in the style attribute.
 *
 * @return The value, or undefined when the element does not set it.
 */
function readStyleProperty(
	node: Element | null,
	property: unknown
): string | undefined {
	if ( ! node || typeof property !== 'string' ) {
		return undefined;
	}

	const value = ( node as HTMLElement ).style?.getPropertyValue( property );

	return value ? value.trim() : undefined;
}

/**
 * Assigns a value to an attribute, which may name a path into a nested one.
 *
 * A block attribute such as `style` holds an object the block itself shapes, so
 * a declaration writes `style.typography.textAlign` to reach into it rather
 * than replacing the whole attribute.
 *
 * @param attributes Attributes being built.
 * @param path       Attribute name, or a dot separated path into one.
 * @param value      Value to assign.
 */
function setAttributePath(
	attributes: Record< string, unknown >,
	path: string,
	value: unknown
): void {
	const steps = path.split( '.' );
	const last = steps.pop() as string;

	let target = attributes;

	steps.forEach( ( step ) => {
		if ( ! target[ step ] || typeof target[ step ] !== 'object' ) {
			target[ step ] = {};
		}

		target = target[ step ] as Record< string, unknown >;
	} );

	target[ last ] = value;
}

/**
 * Builds the transform function a declared `raw` transform implies.
 *
 * Returns `undefined` when the declaration needs no function, in which case the
 * raw handling pipeline falls back to sourcing every attribute from the matched
 * markup, which is what a selector-only transform means.
 *
 * @param transform Declared transform.
 * @param blockName Name of the block the transform belongs to.
 *
 * @return Transform function, or undefined.
 */
function createRawTransform(
	transform: DeclarativeTransform,
	blockName: string
) {
	const {
		attributes: attributeOverrides,
		sourceAttributes,
		innerBlocks,
	} = transform;

	const convertsInnerBlocks =
		innerBlocks !== undefined && innerBlocks !== false;

	if (
		attributeOverrides === undefined &&
		sourceAttributes !== false &&
		! convertsInnerBlocks
	) {
		return undefined;
	}

	return ( node: Element, handler: Function ) => {
		/*
		 * Inner blocks are taken out of a copy, so the caller's node is left
		 * alone; a transform extracting none reads the node as it is, and one
		 * extracting everything needs only the empty shell, not a deep copy
		 * it would immediately clear.
		 */
		const sourceNode = convertsInnerBlocks
			? ( node.cloneNode( typeof innerBlocks === 'string' ) as Element )
			: node;
		let innerBlockList: unknown[] = [];

		const toBlocks = ( html: string ) => {
			const result = handler( { HTML: html, mode: 'BLOCKS' } );
			return Array.isArray( result ) ? result : [];
		};

		if ( true === innerBlocks ) {
			innerBlockList = toBlocks( node.innerHTML );
			sourceNode.innerHTML = '';
		} else if ( typeof innerBlocks === 'string' ) {
			/*
			 * The matched children are converted where they stand, in the
			 * copy: re-parsed on their own they would lose their parent, and
			 * a child selector such as the List Item's `ol > li` could never
			 * match its own block again.
			 */
			const matched = Array.from( sourceNode.children ).filter(
				( child ) => matchesSelector( child, innerBlocks )
			);
			const rawTransforms = getRawTransforms();
			innerBlockList = matched.flatMap( ( child ) =>
				nodeToBlock( child, handler as any, rawTransforms )
			);
			matched.forEach( ( child ) => child.remove() );
		}

		let attributes =
			false === sourceAttributes
				? {}
				: getBlockAttributes( blockName, sourceNode.outerHTML );

		if ( attributeOverrides ) {
			attributes = {
				...attributes,
				...resolveAttributeOverrides( attributeOverrides, sourceNode ),
			};
		}

		return createBlock( blockName, attributes, innerBlockList as any );
	};
}

/**
 * Builds the attribute readers a `shortcode` transform runs.
 *
 * The shortcode converter calls a `shortcode` function per attribute, passing
 * it the shortcode's parsed attributes and the match it came from. A declared
 * attribute names where to read the value instead: `shortcodeText` takes the
 * shortcode as it was written, and `shortcodeAttribute` takes a named
 * attribute, or the first one present when it names several.
 *
 * @param attributes Declared attributes.
 *
 * @return Attributes in the shape the shortcode converter expects.
 */
function createShortcodeAttributes( attributes: unknown ) {
	if ( ! attributes || typeof attributes !== 'object' ) {
		return attributes;
	}

	return Object.fromEntries(
		Object.entries( attributes as Record< string, any > ).map(
			( [ name, definition ] ) => {
				// Only a function can read a shortcode: anything else — a
				// callable name that travelled through JSON, say — must not
				// reach the converter that calls it.
				if (
					definition &&
					typeof definition === 'object' &&
					'shortcode' in definition &&
					typeof definition.shortcode !== 'function'
				) {
					const { shortcode, ...safe } = definition;
					definition = safe;
				}

				const { source, attribute, ...rest } = definition ?? {};

				if ( 'shortcodeText' === source ) {
					return [
						name,
						{
							...rest,
							// The matched text as the editor stores it:
							// classic content arrives wrapped in the
							// paragraphs `wpautop` added, which the block
							// saves back verbatim.
							shortcode: ( _attrs: unknown, match: any ) =>
								removep( autop( match?.content ?? '' ) ),
						},
					];
				}

				if ( 'shortcodeAttribute' === source ) {
					const names = Array.isArray( attribute )
						? attribute
						: [ attribute ];

					return [
						name,
						{
							...rest,
							shortcode: ( { named = {} }: any = {} ) =>
								names
									.map( ( key: string ) => named[ key ] )
									.find(
										( value: unknown ) =>
											undefined !== value
									),
						},
					];
				}

				return [ name, definition ];
			}
		)
	);
}

/**
 * Builds the transform function a declared block-to-block transform implies.
 *
 * @param target     Name of the block the transform produces.
 * @param attributes Declared attribute policy.
 *
 * @return Transform function.
 */
function createBlockTransform( target: string, attributes: unknown ) {
	return (
		sourceAttributes: Record< string, unknown >,
		innerBlocks: any
	) => {
		let nextAttributes: Record< string, unknown > = {};

		if ( 'all' === attributes ) {
			nextAttributes = { ...sourceAttributes };
		} else if ( attributes && typeof attributes === 'object' ) {
			nextAttributes = Object.fromEntries(
				Object.entries( attributes as Record< string, string > )
					.map( ( [ name, from ] ) => [
						name,
						sourceAttributes?.[ from ],
					] )
					.filter( ( [ , value ] ) => value !== undefined )
			);
		}

		return createBlock( target, nextAttributes, innerBlocks );
	};
}

/**
 * Normalizes one declared transform into the runnable form the editor expects.
 *
 * @param transform Declared transform.
 * @param blockName Name of the block the transform belongs to.
 * @param direction Whether the transform is declared under `from` or `to`.
 *
 * @return Runnable transforms. A block-to-block transform naming several blocks
 *         expands to one transform per block, because the editor does not tell
 *         a transform which of them it was chosen for.
 */
function normalizeTransform(
	transform: DeclarativeTransform,
	blockName: string,
	direction: 'from' | 'to'
): DeclarativeTransform[] {
	const {
		attributes,
		sourceAttributes,
		innerBlocks,
		schema,
		// Read by the server-side converter only.
		serverConversion,
		...rest
	} = transform;

	if ( 'raw' === transform.type ) {
		const normalized: DeclarativeTransform = { ...rest };

		if ( schema ) {
			normalized.schema = ( args: SchemaArgs ) =>
				resolveContentSchema( schema, args );
		}

		const transformFunction = createRawTransform( transform, blockName );
		if ( transformFunction ) {
			normalized.transform = transformFunction;
		}

		return [ normalized ];
	}

	if ( 'shortcode' === transform.type ) {
		return [
			{ ...rest, attributes: createShortcodeAttributes( attributes ) },
		];
	}

	if ( 'block' === transform.type ) {
		// A `from` transform produces the block declaring it; a `to` transform
		// produces one of the blocks it names.
		const targets =
			'from' === direction
				? [ blockName ]
				: ( transform.blocks ?? [] ).filter(
						( name: string ) => '*' !== name
				  );

		return targets.map( ( target: string ) => ( {
			...rest,
			blocks: 'from' === direction ? transform.blocks : [ target ],
			transform: createBlockTransform( target, attributes ),
		} ) );
	}

	/*
	 * An `enter`, `files` or `prefix` transform is nothing without its
	 * `transform` function, which JSON cannot carry — the published schema
	 * does not admit these types — so a declared husk is dropped rather than
	 * handed to editor code that would call what is not there. Anything else
	 * unknown is carried through as declared.
	 */
	if ( [ 'enter', 'files', 'prefix' ].includes( transform.type ) ) {
		return [];
	}

	return [ { ...transform } ];
}

/**
 * Determines whether a transforms declaration carries function values.
 *
 * Functions cannot come out of `block.json`: their presence means JavaScript
 * configuration was passed where metadata belongs — commonly
 * `registerBlockType( config, config )` — and those transforms are runnable
 * exactly as written, where normalizing would replace them with generated
 * stand-ins.
 *
 * @param value Transforms declaration, or part of one.
 *
 * @return Whether a function appears anywhere in it.
 */
export function holdsFunctionTransforms( value: unknown ): boolean {
	if ( typeof value === 'function' ) {
		return true;
	}

	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	return Object.values( value ).some( holdsFunctionTransforms );
}

/**
 * Normalizes the transforms declared in a block type's metadata.
 *
 * @param transforms Transforms as declared in `block.json`.
 * @param blockName  Name of the block the transforms belong to.
 *
 * @return Transforms in the runnable shape, keyed by direction.
 */
export function normalizeMetadataTransforms(
	transforms: Record< string, DeclarativeTransform[] > | undefined,
	blockName: string
): Record< string, DeclarativeTransform[] > {
	if ( ! transforms || typeof transforms !== 'object' ) {
		return {};
	}

	return Object.fromEntries(
		( [ 'from', 'to' ] as const )
			.filter( ( direction ) => Array.isArray( transforms[ direction ] ) )
			.map( ( direction ) => [
				direction,
				transforms[ direction ].flatMap( ( transform ) =>
					normalizeTransform( transform, blockName, direction )
				),
			] )
	);
}

/**
 * Merges the transforms a block declares in its metadata with the ones it
 * registers in JavaScript.
 *
 * A block that registers transforms only in JavaScript keeps them unchanged, so
 * this is transparent to any block that does not use the metadata field. A
 * JavaScript transform sharing the `name` of a declared one is merged over it,
 * which is how a block declares what PHP needs while keeping behaviour that can
 * only be written as a function.
 *
 * @param metadataTransforms Normalized transforms declared in metadata.
 * @param clientTransforms   Transforms registered in JavaScript.
 *
 * @return The merged transforms.
 */
export function mergeBlockTransforms(
	metadataTransforms: Record< string, DeclarativeTransform[] > = {},
	clientTransforms: Record< string, DeclarativeTransform[] > = {}
): Record< string, DeclarativeTransform[] > | undefined {
	// A parameter default does not apply to `null`, which settings have
	// always been allowed to spell `transforms` as.
	metadataTransforms = metadataTransforms ?? {};
	clientTransforms = clientTransforms ?? {};

	const directions = new Set( [
		...Object.keys( metadataTransforms ),
		...Object.keys( clientTransforms ),
	] );

	// Leave a block that declares no transforms exactly as it was.
	if ( 0 === directions.size ) {
		return undefined;
	}

	const merged: Record< string, DeclarativeTransform[] > = {};

	directions.forEach( ( direction ) => {
		const declared = metadataTransforms[ direction ];

		if ( ! Array.isArray( declared ) ) {
			/*
			 * Copied rather than read: a block may define a direction as an
			 * accessor to keep the list current as other blocks register, and
			 * reading it here would freeze it at whatever was registered so
			 * far. The Shortcode block's `to` is one.
			 */
			const descriptor = Object.getOwnPropertyDescriptor(
				clientTransforms,
				direction
			);

			if ( descriptor ) {
				Object.defineProperty( merged, direction, descriptor );
			}

			return;
		}

		const client = clientTransforms[ direction ];

		if ( ! Array.isArray( client ) ) {
			merged[ direction ] = declared;

			return;
		}

		const result = [ ...declared ];

		client.forEach( ( clientTransform ) => {
			const index = clientTransform.name
				? result.findIndex(
						( declaredTransform ) =>
							declaredTransform.name === clientTransform.name
				  )
				: -1;

			if ( index !== -1 ) {
				result[ index ] = {
					...result[ index ],
					...clientTransform,
				};
			} else if ( ! result.includes( clientTransform ) ) {
				// The very same object on both sides is one configuration
				// passed as metadata and settings alike —
				// `registerBlockType( config, config )` — not two transforms.
				result.push( clientTransform );
			}
		} );

		merged[ direction ] = result;
	} );

	return merged;
}

/**
 * Exported for testing the schema tokens in isolation.
 *
 * @param schema Declared content schema.
 * @param args   Schema arguments.
 *
 * @return Resolved content schema.
 */
export function resolveDeclaredContentSchema(
	schema: unknown,
	args: Partial< SchemaArgs > = {}
): unknown {
	return resolveContentSchema( schema, {
		phrasingContentSchema:
			args.phrasingContentSchema ?? getPhrasingContentSchema(),
		isPaste: args.isPaste ?? false,
	} );
}
