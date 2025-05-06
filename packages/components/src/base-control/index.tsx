import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import { VisuallyHidden } from '../visually-hidden';
import type { BaseControlProps, BaseControlVisualLabelProps } from './types';
import {
	Wrapper,
	StyledField,
	StyledLabel,
	StyledHelp,
	StyledVisualLabel,
} from './styles/base-control-styles';
import type { WordPressComponent, WordPressComponentProps } from '../context';
import { contextConnectWithoutRef, useContextSystem } from '../context';

export { useBaseControlProps } from './hooks';

const UnconnectedBaseControl = (
	props: WordPressComponentProps< BaseControlProps, null, false >
) => {
	const {
		id,
		label,
		hideLabelFromVision = false,
		help,
		className,
		children,
	} = useContextSystem( props, 'BaseControl' );

	return (
		<Wrapper className={ className }>
			<StyledField className="components-base-control__field">
				{ label &&
					id &&
					( hideLabelFromVision ? (
						<VisuallyHidden as="label" htmlFor={ id }>
							{ label }
						</VisuallyHidden>
					) : (
						<StyledLabel
							className="components-base-control__label"
							htmlFor={ id }
						>
							{ label }
						</StyledLabel>
					) ) }
				{ label &&
					! id &&
					( hideLabelFromVision ? (
						<VisuallyHidden as="label">{ label }</VisuallyHidden>
					) : (
						<VisualLabel>{ label }</VisualLabel>
					) ) }
				{ children }
			</StyledField>
			{ !! help && (
				<StyledHelp
					id={ id ? id + '__help' : undefined }
					className="components-base-control__help"
				>
					{ help }
				</StyledHelp>
			) }
		</Wrapper>
	);
};

const UnforwardedVisualLabel = (
	props: WordPressComponentProps< BaseControlVisualLabelProps, 'span' >,
	ref: ForwardedRef< any >
) => {
	const { className, children, ...restProps } = props;

	return (
		<StyledVisualLabel
			ref={ ref }
			{ ...restProps }
			className={ clsx( 'components-base-control__label', className ) }
		>
			{ children }
		</StyledVisualLabel>
	);
};

export const VisualLabel = forwardRef( UnforwardedVisualLabel );

// `BaseControl` renders its own wrapper and doesn't forward props to an
// underlying element, so the connected component is typed explicitly. Without
// it, the non-polymorphic flag can't be recovered from a props type built with
// a `null` element type, and the unsupported `as` prop leaks back into the
// public type.
const ConnectedBaseControl: WordPressComponent<
	null,
	BaseControlProps,
	false
> = contextConnectWithoutRef( UnconnectedBaseControl, 'BaseControl' );

/**
 * `BaseControl` is a low-level component used to generate labels and help text for components handling user inputs.
 *
 * ```jsx
 * import { BaseControl, useBaseControlProps } from '@wordpress/components';
 *
 * // Render a `BaseControl` for a textarea input
 * const MyCustomTextareaControl = ({ children, ...baseProps }) => (
 * 	// `useBaseControlProps` is a convenience hook to get the props for the `BaseControl`
 * 	// and the inner control itself. Namely, it takes care of generating a unique `id`,
 * 	// properly associating it with the `label` and `help` elements.
 * 	const { baseControlProps, controlProps } = useBaseControlProps( baseProps );
 *
 * 	return (
 * 		<BaseControl { ...baseControlProps }>
 * 			<textarea { ...controlProps }>
 * 			  { children }
 * 			</textarea>
 * 		</BaseControl>
 * 	);
 * );
 * ```
 */
export const BaseControl = Object.assign(
	ConnectedBaseControl,

	{
		/**
		 * `BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.
		 *
		 * It should only be used in cases where the children being rendered inside `BaseControl` are already accessibly labeled,
		 * e.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would
		 * otherwise use if the `label` prop was passed.
		 *
		 * ```jsx
		 * import { BaseControl } from '@wordpress/components';
		 *
		 * const MyBaseControl = () => (
		 * 	<BaseControl help="This button is already accessibly labeled.">
		 * 		<BaseControl.VisualLabel>Author</BaseControl.VisualLabel>
		 * 		<Button>Select an author</Button>
		 * 	</BaseControl>
		 * );
		 * ```
		 */
		VisualLabel,
	}
);

export default BaseControl;
