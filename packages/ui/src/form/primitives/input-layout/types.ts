export interface InputLayoutProps
	extends Omit< React.HTMLAttributes< HTMLDivElement >, 'prefix' > {
	/**
	 * Whether the field should be visually styled as disabled.
	 */
	visuallyDisabled?: boolean;
	/**
	 * The size of the field.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'compact' | 'small';
	/**
	 * Whether the field should hide the border.
	 */
	isBorderless?: boolean;
	/**
	 * Element to render before the input.
	 */
	prefix?: React.ReactNode;
	/**
	 * Element to render after the input.
	 */
	suffix?: React.ReactNode;
}

export interface InputLayoutSlotProps
	extends React.HTMLAttributes< HTMLDivElement > {
	/**
	 * The padding of the slot.
	 *
	 * `minimal` will work best when the slot content is a button or icon.
	 */
	padding?: 'default' | 'minimal';
}
