/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';

function BaseControl( { as = 'div', id, label, hideLabelFromVision, help, className, children } ) {
	const isFieldSet = as === 'fieldset';

	/**
	 * BaseControl can only render as either a fieldset or a div
	 */
	const WrapperComponent = as;
	const LabelComponent = isFieldSet ? 'legend' : 'label';
	const VisualLabelComponent = isFieldSet ? 'legend' : 'span';

	return (
		<WrapperComponent className={ classnames( 'components-base-control', className ) }>
			<div className="components-base-control__field">
				{ label && id && ( hideLabelFromVision ?
					<VisuallyHidden
						as="label"
						htmlFor={ id }>{ label }</VisuallyHidden> :
					<LabelComponent
						className="components-base-control__label"
						htmlFor={ id }>{ label }</LabelComponent>
				) }
				{ label && ! id && ( hideLabelFromVision ?
					<VisuallyHidden
						as="label">{ label }</VisuallyHidden> :
					<BaseControl.VisualLabel as={ VisualLabelComponent }>{ label }</BaseControl.VisualLabel>
				) }
				{ children }
			</div>
			{ !! help && <p id={ id + '__help' } className="components-base-control__help">{ help }</p> }
		</WrapperComponent>
	);
}

BaseControl.VisualLabel = ( { as = 'span', className, children } ) => {
	const Component = as;
	const classes = classnames( 'components-base-control__label', className );

	return (
		<Component className={ classes }>
			{ children }
		</Component>
	);
};

export default BaseControl;
