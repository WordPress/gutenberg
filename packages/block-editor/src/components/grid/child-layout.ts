import {
	getValueFromObjectPath,
	isPlainObject,
	setImmutably,
} from '../../utils/object';

type Style = Record< string, unknown >;

/**
 * Returns the child layout of a block style: the default layout and the
 * layout of each viewport state, keyed by their path in the style object.
 *
 * @param style Block style attributes.
 * @return Pairs of style object path and child layout.
 */
function getChildLayoutEntries( style: unknown ): [ string[], unknown ][] {
	if ( ! isPlainObject( style ) ) {
		return [];
	}

	const entries: [ string[], unknown ][] = [];
	if ( isPlainObject( style.layout ) ) {
		entries.push( [ [ 'layout' ], style.layout ] );
	}
	Object.entries( style ).forEach( ( [ key, stateStyle ] ) => {
		// Viewport states (`@mobile`, `@tablet`) hold their own child layout.
		if (
			key.startsWith( '@' ) &&
			isPlainObject( stateStyle ) &&
			isPlainObject( stateStyle.layout )
		) {
			entries.push( [ [ key, 'layout' ], stateStyle.layout ] );
		}
	} );
	return entries;
}

/**
 * Returns the child layouts of a block style, keyed by the state they belong
 * to: `layout` for the default layout, and the viewport state (such as
 * `@mobile`) for each viewport's layout. The values are the style's own layout
 * objects, so the result compares shallowly equal until a layout changes.
 *
 * @param style Block style attributes.
 * @return The child layouts by state.
 */
export function getChildLayoutsByState(
	style: unknown
): Record< string, unknown > {
	return Object.fromEntries(
		getChildLayoutEntries( style ).map( ( [ path, layout ] ) => [
			path[ 0 ],
			layout,
		] )
	);
}

/**
 * Builds a style attribute holding only the given child layouts, the reverse
 * of `getChildLayoutsByState`.
 *
 * @param layouts The child layouts by state.
 * @return A style attribute with the child layouts.
 */
export function getChildLayoutStyle(
	layouts: Record< string, unknown >
): Style {
	return Object.fromEntries(
		Object.entries( layouts ).map( ( [ state, layout ] ) => [
			state,
			state === 'layout' ? layout : { layout },
		] )
	);
}

/**
 * Gives a block the child layout (such as a grid item's position and span) of
 * another block whose place it takes, keeping any child layout it already has.
 *
 * @param style     The style attribute of the block taking the place.
 * @param fromStyle The style attribute of the block whose place it takes.
 * @return The updated style attribute, or the same one if nothing changed.
 */
export function copyChildLayout(
	style: Style | undefined,
	fromStyle: unknown
): Style | undefined {
	let newStyle = style;
	getChildLayoutEntries( fromStyle ).forEach( ( [ path, layout ] ) => {
		// A block that sets a child layout itself knows best.
		if ( getValueFromObjectPath( newStyle, path ) === undefined ) {
			// Setting a path on the style object keeps it an object.
			newStyle = setImmutably( newStyle, path, layout ) as Style;
		}
	} );
	return newStyle;
}
