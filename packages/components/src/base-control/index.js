/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';
import {
	Wrapper,
	StyledField,
	StyledLabel,
	StyledHelp,
	StyledVisualLabel,
} from './styles/base-control-styles';

/**
 * @typedef Props
 * @property {string}                    [id]                  The id of the element to which labels and help text are being generated.
 *                                                             That element should be passed as a child.
 * @property {import('react').ReactNode} help                  If this property is added, a help text will be
 *                                                             generated using help property as the content.
 * @property {import('react').ReactNode} [label]               If this property is added, a label will be generated
 *                                                             using label property as the content.
 * @property {boolean}                   [hideLabelFromVision] If true, the label will only be visible to screen readers.
 * @property {string}                    [className]           The class that will be added with "components-base-control" to the
 *                                                             classes of the wrapper div. If no className is passed only
 *                                                             components-base-control is used.
 * @property {import('react').ReactNode} [children]            The content to be displayed within
 *                                                             the BaseControl.
 */

/**
 * @param {Props} props
 * @return {JSX.Element} Element
 */
function BaseControl( {
	id,
	label,
	hideLabelFromVision,
	help,
	className,
	children,
} ) {
	return (
		<Wrapper
			className={ classnames( 'components-base-control', className ) }
		>
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
						<BaseControl.VisualLabel>
							{ label }
						</BaseControl.VisualLabel>
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
}

/**
 * @typedef VisualLabelProps
 * @property {string}                    [className] Class name
 * @property {import('react').ReactNode} [children]  Children
 */

/**
 * @param {VisualLabelProps} Props
 * @return {JSX.Element} Element
 */
BaseControl.VisualLabel = ( { className, children } ) => {
	return (
		<StyledVisualLabel
			className={ classnames(
				'components-base-control__label',
				className
			) }
		>
			{ children }
		</StyledVisualLabel>
	);
};

export default BaseControl;
