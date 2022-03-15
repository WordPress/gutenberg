/**
 * External dependencies
 */
import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type {
	Wrapper,
	StyledField,
	StyledVisualLabel,
} from './styles/base-control-styles';

export type BaseControlProps = {
	/**
	 * Start opting into the new margin-free styles that will become the default in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * The id of the element to which labels and help text are being generated.
	 * That element should be passed as a child.
	 */
	id?: string;
	/**
	 * If this property is added, a help text will be generated using help property as the content.
	 */
	help?: ReactNode;
	/**
	 * If this property is added, a label will be generated using label property as the content.
	 */
	label?: ReactNode;
	/**
	 * If true, the label will only be visible to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: boolean;
	className?: HTMLAttributes< typeof Wrapper >[ 'className' ];
	/**
	 * The content to be displayed within the `BaseControl`.
	 */
	children?: HTMLAttributes< typeof StyledField >[ 'children' ];
};

export type BaseControlVisualLabelProps = Pick<
	HTMLAttributes< typeof StyledVisualLabel >,
	'className' | 'children'
>;
