/**
 * Blocks that do not carry their content in the document. They store a
 * reference to an entity record and read the content from it, so the edits a
 * user makes "inside" one of these blocks belong to the referenced record
 * rather than to the document being edited.
 *
 * `getRecordId` receives the block attributes and a context object holding the
 * pieces of state a reference may need to resolve — currently only the active
 * theme's stylesheet, which template parts combine with their slug.
 *
 * @type {Record<string, {kind: string, name: string, getRecordId: Function}>}
 */
const ENTITY_BLOCK_REFERENCES = {
	'core/block': {
		kind: 'postType',
		name: 'wp_block',
		getRecordId: ( attributes ) => attributes?.ref,
	},
	'core/navigation': {
		kind: 'postType',
		name: 'wp_navigation',
		getRecordId: ( attributes ) => attributes?.ref,
	},
	'core/template-part': {
		kind: 'postType',
		name: 'wp_template_part',
		getRecordId: ( attributes, { theme } ) => {
			const stylesheet = attributes?.theme ?? theme;
			return attributes?.slug && stylesheet
				? `${ stylesheet }//${ attributes.slug }`
				: undefined;
		},
	},
};

/**
 * Whether any registered block references records of the given entity.
 *
 * @param {string} kind Entity kind.
 * @param {string} name Entity name.
 *
 * @return {boolean} Whether the entity is referenced by a block.
 */
export function isBlockReferencedEntity( kind, name ) {
	return Object.values( ENTITY_BLOCK_REFERENCES ).some(
		( reference ) => reference.kind === kind && reference.name === name
	);
}

/**
 * Builds the key an entity record is tracked under while diffing references.
 * Record IDs are numbers for some entities and strings for others, and the
 * edits state keys them as strings, so the key normalises them the same way.
 *
 * @param {string}        kind     Entity kind.
 * @param {string}        name     Entity name.
 * @param {string|number} recordId Record ID.
 *
 * @return {string} The reference key.
 */
export function getEntityReferenceKey( kind, name, recordId ) {
	return `${ kind }|${ name }|${ recordId }`;
}

/**
 * Walks a block tree looking for references to the given entity records.
 *
 * The walk stops as soon as every key has been found, so passing the smallest
 * set of keys that matters keeps the common case cheap.
 *
 * @param {Array}       blocks          The block tree to walk.
 * @param {Set<string>} keys            Reference keys to look for, as built by
 *                                      `getEntityReferenceKey`.
 * @param {Object}      context         Context for resolving a reference.
 * @param {string}      [context.theme] The active theme's stylesheet.
 *
 * @return {Set<string>} The subset of `keys` the tree references.
 */
export function findReferencedEntityRecords( blocks, keys, context ) {
	const found = new Set();

	if ( ! keys.size || ! Array.isArray( blocks ) ) {
		return found;
	}

	const stack = [ ...blocks ];

	while ( stack.length ) {
		const block = stack.pop();

		if ( ! block ) {
			continue;
		}

		const reference = ENTITY_BLOCK_REFERENCES[ block.name ];

		if ( reference ) {
			const recordId = reference.getRecordId( block.attributes, context );

			if ( recordId !== undefined && recordId !== null ) {
				const key = getEntityReferenceKey(
					reference.kind,
					reference.name,
					recordId
				);

				if ( keys.has( key ) ) {
					found.add( key );

					if ( found.size === keys.size ) {
						return found;
					}
				}
			}
		}

		if ( block.innerBlocks?.length ) {
			stack.push( ...block.innerBlocks );
		}
	}

	return found;
}
