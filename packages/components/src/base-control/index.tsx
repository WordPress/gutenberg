/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';
import type { BaseControlProps, BaseControlVisualLabelProps } from './types';
import {
	Wrapper,
	StyledField,
	StyledLabel,
	StyledHelp,
	StyledVisualLabel,
} from './styles/base-control-styles';
import type { WordPressComponentProps } from '../context';
import { contextConnectWithoutRef, useContextSystem } from '../context';

export { useBaseControlProps } from './hooks';

const UnconnectedBaseControl = (
	props: WordPressComponentProps< BaseControlProps, null >
) => {
	const {
		__nextHasNoMarginBottom = false,
		__associatedWPComponentName = 'BaseControl',
		id,
		label,
		hideLabelFromVision = false,
		help,
		className,
		children,
	} = useContextSystem( props, 'BaseControl' );

	if ( ! __nextHasNoMarginBottom ) {
		deprecated(
			`Bottom margin styles for wp.components.${ __associatedWPComponentName }`,
			{
				since: '6.7',
				version: '7.0',
				hint: 'Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version.',
			}
		);
	}

	return (
		<Wrapper className={ className }>
			<StyledField
				className="components-base-control__field"
				// TODO: Official deprecation for this should start after all internal usages have been migrated
				__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			>
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
					__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
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

/**
 * `BaseControl` is a component used to generate labels and help text for components handling user inputs.
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
 * 		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
 * 			<textarea { ...controlProps }>
 * 			  { children }
 * 			</textarea>
 * 		</BaseControl>
 * 	);
 * );
 * ```
 */
export const BaseControl = Object.assign(
	contextConnectWithoutRef( UnconnectedBaseControl, 'BaseControl' ),

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
		 * 	<BaseControl
		 * 		__nextHasNoMarginBottom
		 * 		help="This button is already accessibly labeled."
		 * 	>
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
