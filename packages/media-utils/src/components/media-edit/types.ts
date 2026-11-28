import type { DataFormControlProps } from '@wordpress/dataviews';

/**
 * The props of the media control.
 */
export interface MediaEditProps< Item > extends Pick<
	DataFormControlProps< Item >,
	'data' | 'field' | 'onChange' | 'hideLabelFromVision' | 'validity'
> {
	/**
	 * Array of allowed media types (e.g., ['image', 'video']).
	 * Use ['*'] to allow all file types.
	 *
	 * @default ['image']
	 */
	allowedTypes?: string[];
	/**
	 * Whether to allow multiple media selections.
	 *
	 * @default false
	 */
	multiple?: boolean;
	/**
	 * Whether to render in an expanded form.
	 *
	 * @default false
	 */
	isExpanded?: boolean;
}
