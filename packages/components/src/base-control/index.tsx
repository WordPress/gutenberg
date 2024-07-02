/**
 * External dependencies
 */
import clsx from 'clsx';

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
 * 		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom={ true }>
 * 			<textarea { ...controlProps }>
 * 			  { children }
 * 			</textarea>
 * 		</BaseControl>
 * 	);
 * );
 * ```
 */
const UnconnectedBaseControl = (
	props: WordPressComponentProps< BaseControlProps, null >
) => {
	const {
		__nextHasNoMarginBottom = false,
		id,
		label,
		hideLabelFromVision = false,
		help,
		className,
		children,
	} = useContextSystem( props, 'BaseControl' );

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

/**
 * `BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.
 *
 * It should only be used in cases where the children being rendered inside `BaseControl` are already accessibly labeled,
 * e.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would
 * otherwise use if the `label` prop was passed.
 *
 * @example
 * import { BaseControl } from '@wordpress/components';
 *
 * const MyBaseControl = () => (
 * 	<BaseControl help="This button is already accessibly labeled.">
 * 		<BaseControl.VisualLabel>Author</BaseControl.VisualLabel>
 * 		<Button>Select an author</Button>
 * 	</BaseControl>
 * );
 */
export const VisualLabel = ( {
	className,
	children,
	...props
}: WordPressComponentProps< BaseControlVisualLabelProps, 'span' > ) => {
	return (
		<StyledVisualLabel
			{ ...props }
			className={ clsx( 'components-base-control__label', className ) }
		>
			{ children }
		</StyledVisualLabel>
	);
};

export const BaseControl = Object.assign(
	contextConnectWithoutRef( UnconnectedBaseControl, 'BaseControl' ),
	{ VisualLabel }
);

export default BaseControl;
