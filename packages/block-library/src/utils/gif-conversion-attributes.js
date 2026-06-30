/**
 * Returns the subset of block attributes that should be carried over when
 * converting between the animated-GIF Image block and its converted Video
 * block (in either direction).
 *
 * The conversion swaps one block for another via `createBlock`, which would
 * otherwise drop everything the author set on the original block. This carries
 * the attributes both blocks support, so the conversion (and its reverse) keeps
 * them: block alignment, the HTML anchor, custom class names, and margin
 * spacing.
 *
 * Image-only attributes such as links (`href`/`linkDestination`), sizing
 * (`sizeSlug`/`scale`), and `border`/`shadow` styles are intentionally not
 * carried: the Video block has no equivalent, so copying them would leave
 * attributes the target block cannot represent.
 *
 * @param {Object} attributes Source block attributes.
 * @return {Object} Attributes to spread into the converted block.
 */
export function getCarriedGifConversionAttributes( attributes ) {
	const { align, anchor, className, style } = attributes;
	const margin = style?.spacing?.margin;

	return {
		...( align && { align } ),
		...( anchor && { anchor } ),
		...( className && { className } ),
		...( margin && { style: { spacing: { margin } } } ),
	};
}
