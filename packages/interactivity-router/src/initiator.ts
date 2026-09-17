import { getElement } from '@wordpress/interactivity';

export const regionAttr = `data-wp-router-region`;

/**
 * Parses the given region's directive.
 *
 * @param region Region element.
 * @return Data contained in the region directive value.
 */
export const parseRegionAttribute = ( region: Element ) => {
	const value = region.getAttribute( regionAttr );
	try {
		const { id, attachTo } = JSON.parse( value );
		return { id, attachTo };
	} catch {
		return { id: value };
	}
};

/**
 * Resolves the initiator id for a navigation.
 *
 * An explicit string always wins over detection. An explicit `null` opts out
 * of detection entirely. Otherwise, the router derives the id of the
 * innermost `data-wp-router-region` containing the element that triggered the
 * navigation (e.g. the link a click handler is bound to), if there is one.
 * A navigation triggered outside any directive scope — a full-page listener,
 * a back/forward restore, a programmatic call with no active scope — resolves
 * to `null`.
 *
 * @param initiator The `initiator` option passed to `navigate()`, if any.
 * @return The resolved initiator id, or `null`.
 */
export const resolveInitiator = (
	initiator: string | null | undefined
): string | null => {
	if ( typeof initiator === 'string' || initiator === null ) {
		return initiator;
	}
	let ref: Element | null = null;
	try {
		ref = getElement().ref;
	} catch {
		return null;
	}
	const region = ref?.closest?.( `[${ regionAttr }]` );
	return region ? ( parseRegionAttribute( region ).id ?? null ) : null;
};
