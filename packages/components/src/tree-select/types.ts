import type {
	SelectControlMultipleSelectionProps,
	SelectControlSingleSelectionProps,
} from '../select-control/types';

export type Truthy< T > = T extends false | '' | 0 | null | undefined
	? never
	: T;

export interface Tree {
	id: string;
	name: string;
	children?: Tree[];
}

type TreeSelectOwnProps = {
	/**
	 * If this property is added, an option will be added with this label to represent empty selection.
	 */
	noOptionLabel?: string;
	/**
	 * An array containing the tree objects with the possible nodes the user can select.
	 */
	tree?: Tree[];
};

export type TreeSelectSingleSelectionProps = Omit<
	SelectControlSingleSelectionProps,
	'value' | 'multiple'
> &
	TreeSelectOwnProps & {
		/**
		 * If this property is added, multiple values can be selected. The `selectedId` passed should be an array.
		 *
		 * In most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.
		 *
		 * @default false
		 */
		multiple?: false;
		/**
		 * The id of the currently selected node.
		 *
		 * If `multiple` is true, the `selectedId` should be an array of selected node ids.
		 */
		selectedId?: SelectControlSingleSelectionProps[ 'value' ];
	};

export type TreeSelectMultipleSelectionProps = Omit<
	SelectControlMultipleSelectionProps,
	'value' | 'multiple'
> &
	TreeSelectOwnProps & {
		/**
		 * If this property is added, multiple values can be selected. The `selectedId` passed should be an array.
		 *
		 * In most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.
		 *
		 * @default false
		 */
		multiple: true;
		/**
		 * The id of the currently selected node.
		 *
		 * If `multiple` is true, the `selectedId` should be an array of selected node ids.
		 */
		selectedId?: SelectControlMultipleSelectionProps[ 'value' ];
	};

export type TreeSelectProps =
	| TreeSelectSingleSelectionProps
	| TreeSelectMultipleSelectionProps;
