import { getPhrasingContentSchema } from '@wordpress/dom';
import { createBlock } from './factory';
import {
	getBlockAttributes,
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
	return Object.fromEntries(
		Object.entries( overrides )
			.map( ( [ name, value ] ) => {
				if (
					! value ||
					typeof value !== 'object' ||
					Array.isArray( value ) ||
					! ( 'source' in value )
				) {
					return [ name, value ];
				}

				const sourced = parseWithAttributeSchema(
					node.outerHTML,
					value as any
				);

				// A `map` turns a sourced value into one the block declares,
				// such as a heading tag name into a heading level.
				const lookup = ( value as any ).map;
				if ( lookup && typeof lookup === 'object' ) {
					return [
						name,
						Object.prototype.hasOwnProperty.call(
							lookup,
							sourced as string
						)
							? lookup[ sourced as string ]
							: undefined,
					];
				}

				return [ name, sourced ];
			} )
			.filter( ( [ , value ] ) => value !== undefined )
	);
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
		// Inner blocks are taken out of a copy so the caller's node is left alone.
		const sourceNode = node.cloneNode( true ) as Element;
		let innerBlockList: unknown[] = [];

		const toBlocks = ( html: string ) => {
			const result = handler( { HTML: html, mode: 'BLOCKS' } );
			return Array.isArray( result ) ? result : [];
		};

		if ( true === innerBlocks ) {
			innerBlockList = toBlocks( node.innerHTML );
			sourceNode.innerHTML = '';
		} else if ( typeof innerBlocks === 'string' ) {
			const matched = Array.from( sourceNode.children ).filter(
				( child ) => child.matches( innerBlocks )
			);
			innerBlockList = matched.flatMap( ( child ) =>
				toBlocks( child.outerHTML )
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
 * Builds the transform function a declared block-to-block transform implies.
 *
 * @param target     Name of the block the transform produces.
 * @param attributes Declared attribute policy.
 *
 * @return Transform function.
 */
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
				const { source, attribute, ...rest } = definition ?? {};

				if ( 'shortcodeText' === source ) {
					return [
						name,
						{
							...rest,
							shortcode: ( _attrs: unknown, match: any ) =>
								match?.content,
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

	return [
		{
			...rest,
			attributes,
			sourceAttributes,
			innerBlocks,
			schema,
			serverConversion,
		},
	];
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
	const directions = new Set( [
		...Object.keys( metadataTransforms ?? {} ),
		...Object.keys( clientTransforms ?? {} ),
	] );

	// Leave a block that declares no transforms exactly as it was.
	if ( 0 === directions.size ) {
		return undefined;
	}

	return Object.fromEntries(
		Array.from( directions ).map( ( direction ) => {
			const declared = metadataTransforms[ direction ];
			const client = clientTransforms[ direction ];

			if ( ! Array.isArray( declared ) ) {
				return [ direction, client ];
			}

			if ( ! Array.isArray( client ) ) {
				return [ direction, declared ];
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
				} else {
					result.push( clientTransform );
				}
			} );

			return [ direction, result ];
		} )
	);
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
