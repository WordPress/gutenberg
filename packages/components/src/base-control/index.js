/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import VisualLabel from './visual-label';

function BaseControl( {
	as = 'div',
	id,
	label,
	hideLabelFromVision,
	help,
	className,
	children,
} ) {
	const isFieldSet = as === 'fieldset';

	const WrapperComponent = as;
	const LabelComponent = id ? 'label' : 'span';
	const VisualLabelComponent = isFieldSet ? 'legend' : LabelComponent;

	return (
		<WrapperComponent
			className={ classnames( 'components-base-control', className ) }
		>
			<div className="components-base-control__field">
				{ label && (
					<VisualLabel
						as={ VisualLabelComponent }
						hideLabelFromVision={ hideLabelFromVision }
						htmlFor={ id }
					>
						{ label }
					</VisualLabel>
				) }
				{ children }
			</div>
			{ !! help && (
				<p
					id={ id + '__help' }
					className="components-base-control__help"
				>
					{ help }
				</p>
			) }
		</WrapperComponent>
	);
}

BaseControl.VisualLabel = VisualLabel;

export default BaseControl;
