/**
 * Flex Justification follows the writing direction ("left" is the start side),
 * while text alignment is physical. Mirroring in RTL keeps the terms in the
 * same place, and the mapping is the same both ways.
 *
 * @param value Alignment or Justification value.
 * @param isRtl Whether the editor is right to left.
 * @return The mirrored value, or undefined if it has no equivalent.
 */
function mirrorInRtl(
	value: string | undefined,
	isRtl: boolean
): string | undefined {
	if ( value === 'center' ) {
		return 'center';
	}
	if ( value === 'left' || value === 'right' ) {
		return ( value === 'right' ) !== isRtl ? 'right' : 'left';
	}
	return undefined;
}

export interface LayoutValues {
	type?: string;
	justifyContent?: string;
	orientation?: string;
}

export type AlignmentUpdates =
	{ justifyContent: string } | { textAlign: string | null };

/**
 * What to write when the layout type changes, so that the text alignment and
 * the Flex Justification stay in step. Nothing is written unless the user set
 * a value.
 *
 * @param previous  The layout values before the change.
 * @param next      The layout values after the change.
 * @param textAlign The block's text alignment, if any.
 * @param isRtl     Whether the editor is right to left.
 * @return `{ justifyContent }` or `{ textAlign }` (null clears it), or null for no change.
 */
export function getAlignmentUpdates(
	previous: LayoutValues,
	next: LayoutValues,
	textAlign: string | undefined,
	isRtl: boolean
): AlignmentUpdates | null {
	if ( previous.type === next.type ) {
		return null;
	}

	// Into Flex: Justification takes over the alignment the block already has.
	if ( next.type === 'flex' && next.orientation !== 'vertical' ) {
		const justifyContent = mirrorInRtl( textAlign, isRtl );
		return justifyContent && ! next.justifyContent
			? { justifyContent }
			: null;
	}

	// Out of Flex: keep the alignment unless Justification was changed there.
	if (
		previous.type === 'flex' &&
		previous.orientation !== 'vertical' &&
		previous.justifyContent
	) {
		const implied = mirrorInRtl( textAlign, isRtl ) ?? 'left';
		if ( previous.justifyContent === implied ) {
			return null;
		}
		return {
			textAlign: mirrorInRtl( previous.justifyContent, isRtl ) ?? null,
		};
	}

	return null;
}

/**
 * Returns the style with the text alignment set, or removed when it is null.
 *
 * @param style     Block style attribute.
 * @param textAlign New text alignment, or null to remove it.
 * @return The updated style.
 */
export function withTextAlign(
	style: Record< string, any > | undefined,
	textAlign: string | null
): Record< string, any > {
	const { typography: currentTypography, ...rest } = style ?? {};
	const { textAlign: _removed, ...typography } = currentTypography ?? {};
	if ( textAlign ) {
		typography.textAlign = textAlign;
	}
	return Object.keys( typography ).length ? { ...rest, typography } : rest;
}
