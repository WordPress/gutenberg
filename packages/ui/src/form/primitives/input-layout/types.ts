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

export type InputLayoutSlotType = 'prefix' | 'suffix';

export interface InputLayoutSlotProps
	extends Omit< React.HTMLAttributes< HTMLDivElement >, 'type' > {
	/**
	 * The type of the slot.
	 *
	 * When not provided, the type will be automatically inferred from the
	 * `InputLayout` context if the slot is used within a `prefix` or `suffix`.
	 */
	type?: InputLayoutSlotType;
	/**
	 * The padding of the slot.
	 *
	 * `minimal` will work best when the slot content is a button or icon.
	 */
	padding?: 'default' | 'minimal';
}
