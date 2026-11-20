/**
 * Documented values for the `ThemeProvider` `contrast` setting.
 *
 * - `minimum`: the softest theme. Weak text and strokes no longer meet WCAG
 *   AA; focus indicators and text on solid fills keep their standard
 *   contrast.
 * - `standard`: the default theme colors.
 * - `enhanced`: every text role reaches at least 7:1 (WCAG AAA).
 *
 * Any value between `minimum` and `enhanced` can also be used, in steps of
 * `0.1`.
 */
export const contrastLevels = Object.freeze( {
	minimum: -1,
	standard: 0,
	enhanced: 1,
} as const );
