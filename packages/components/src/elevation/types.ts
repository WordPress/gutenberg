export type Props = {
	/**
	 * Renders the active (interaction) shadow value.
	 */
	active?: boolean;
	/**
	 * Renders the border-radius of the shadow.
	 */
	borderRadius?: number | string;
	/**
	 * Renders the focus (interaction) shadow value.
	 */
	focus?: boolean;
	/**
	 * Renders the hover (interaction) shadow value.
	 */
	hover?: boolean;
	/**
	 * Determines if hover, active, and focus shadow values should be automatically calculated and rendered.
	 */
	isInteractive?: boolean;
	/**
	 * Dimensional offsets (margin) for the shadow.
	 */
	offset?: number;
	/**
	 * Size of the shadow, based on the Style system's elevation system. The `value` determines the strength of the shadow, which sense of depth.
	 * In the example below, `isInteractive` is activated to give a better sense of depth.
	 *
	 * @example
	 * ```jsx
	 * import { Elevation, Surface, Text, View } from `@wp-g2/components`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <View css={[ui.padding(5)]}>
	 *       <Surface css={[ui.padding(5)]}>
	 *         <Text>Into The Unknown</Text>
	 *         <Elevation value={8} isInteractive />
	 *       </Surface>
	 *     </View>
	 *   )
	 * }
	 * ```
	 */
	value?: number;
};
