/**
 * Whether a Navigation Submenu is "label only" (#86936): it has no link of its
 * own, so it only opens and closes its items.
 *
 * A `#` link counts too, as it is the usual workaround for a heading that
 * doesn't go anywhere. A new submenu still waiting for its page or custom
 * link (no label yet, and a `kind` saying what it will link to) doesn't.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} Whether the sub menu is label only.
 */
export default function isLabelOnlySubmenu( attributes ) {
	const url = attributes?.url?.trim?.();
	if ( url === '#' ) {
		return true;
	}
	if ( url ) {
		return false;
	}
	return !! attributes?.label || ! attributes?.kind;
}
