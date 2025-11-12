/**
 * Internal dependencies
 */
import type { InputControlProps } from '../input-control/types';

export type SearchControlProps = Pick< InputControlProps, 'help' | 'value' > & {
	/**
	 * @deprecated This is now the default.
	 * @ignore
	 */
	__next40pxDefaultSize?: InputControlProps[ '__next40pxDefaultSize' ];
	/**
	 * Start opting into the new margin-free styles that will become the default in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * If true, the label will only be visible to screen readers.
	 *
	 * @default true
	 */
	hideLabelFromVision?: InputControlProps[ 'hideLabelFromVision' ];
	/**
	 * The accessible label for the input.
	 *
	 * A label should always be provided as an accessibility best practice,
	 * even when a placeholder is defined and `hideLabelFromVision` is `true`.
	 *
	 * @default 'Search'
	 */
	label?: string;
	/**
	 * A function that receives the value of the input when the value is changed.
	 */
	onChange: ( value: string ) => void;
	/**
	 * When an `onClose` callback is provided, the search control will render a close button
	 * that will trigger the given callback.
	 *
	 * Use this if you want the button to trigger your own logic to close the search field entirely,
	 * rather than just clearing the input value.
	 *
	 * @deprecated
	 * @ignore
	 */
	onClose?: () => void;
	/** @ignore */
	onDrag?: InputControlProps[ 'onDrag' ];
	/** @ignore */
	onDragStart?: InputControlProps[ 'onDragStart' ];
	/** @ignore */
	onDragEnd?: InputControlProps[ 'onDragEnd' ];
	/**
	 * A placeholder for the input.
	 *
	 * @default 'Search'
	 */
	placeholder?: InputControlProps[ 'placeholder' ];
	/**
	 * The size of the component
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'compact';
};

export type SuffixItemProps = Pick<
	SearchControlProps,
	'value' | 'onChange' | 'onClose'
> & {
	searchRef: React.RefObject< HTMLInputElement >;
};
