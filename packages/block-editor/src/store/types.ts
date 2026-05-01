/**
 * Describes part of a visible selection in the editor. Namely, either a cursor
 * position within a block or a block entirely contained within a selection.
 *
 * This description covers multiple selection scenarios, each of which impacts
 * how the `attributeKey` and `offset` are set. These two parameters indicate
 * where in a RichText component the cursor sits and with which block attribute
 * that RichText component is associated.
 *
 *  - When a selection covers an entire block or covers multiple blocks, there
 *    is no associated RichText, so both of the parameters are unset.
 *
 *  - When a selection starts, ends, or is a simple position within a block,
 *    both parameters will be set accordingly.
 *
 *  - When a block is being inserted into a document, however, there are multiple
 *    stages determining which parameters are set.
 *
 *      1. A block is created in the data store, but has no appearance in the
 *         editor otherwise. Both parameters are unset.
 *
 *      2. The block has loaded into the editor and there is a RichText field,
 *         but editor focus hasn't yet placed a browser selection inside it.
 *         Only the `attributeKey` is set.
 *
 *      3. The browser has focused into a RichText field and both parameters are set.
 *
 * Selections are thus dynamic because block creation itself loads through multiple
 * intermediate stages before someone is able to highlight, type, or modify text.
 */
export interface WPBlockSelection {
	/**
	 * The selection cursor (start or end) is found within this block,
	 * or this entire block is contained within a multi-block selection.
	 */
	clientId: string;

	/**
	 * When a selection cursor appears within a RichText component which
	 * maps back to a block's attribute, e.g. a paragraph block's `content`
	 * attribute, this will hold the attribute key for that associated
	 * block attribute.
	 */
	attributeKey?: string;

	/**
	 * When a selection cursor appears within a block, it can be found this
	 * many Unicode code points into the RichText component's decoded text
	 * which is associated with the given attribute key.
	 */
	offset?: number;
}

export interface WPSelection {
	selectionEnd: WPBlockSelection;
	selectionStart: WPBlockSelection;
	initialPosition?: number | null;
}
