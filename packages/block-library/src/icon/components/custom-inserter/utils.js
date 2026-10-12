/**
 * Groups icons by collection, in the order of `collections`.
 *
 * @param {Object[]} icons       Icons, each with a `collection` slug.
 * @param {Object[]} collections Icon collections, each with a `slug` and `label`.
 * @return {Object[]} Groups, each with a `slug`, `label` and `icons`.
 */
export function groupIconsByCollection( icons, collections ) {
	const groups = new Map(
		collections.map( ( { slug, label } ) => [
			slug,
			{ slug, label, icons: [] },
		] )
	);

	icons.forEach( ( icon ) => {
		groups.get( icon.collection )?.icons.push( icon );
	} );

	return [ ...groups.values() ].filter( ( group ) => group.icons.length );
}
