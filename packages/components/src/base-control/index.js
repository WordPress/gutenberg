/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';
import {
	Wrapper,
	StyledField,
	StyledLabel,
	StyledHelp,
} from './styles/base-control-styles';

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
					id={ id + '__help' }
					className="components-base-control__help"
				>
					{ help }
				</StyledHelp>
			) }
		</Wrapper>
	);
}

BaseControl.VisualLabel = ( { className, children } ) => {
	className = classnames( 'components-base-control__label', className );
	return <span className={ className }>{ children }</span>;
};

export default BaseControl;
