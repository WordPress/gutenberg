/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';
import { Control, Field, Label, Help } from './styles/index-styles';

function BaseControl( {
	id,
	label,
	hideLabelFromVision,
	help,
	className,
	children,
} ) {
	return (
		<Control
			className={ classnames( 'components-base-control', className ) }
		>
			<Field className="components-base-control__field">
				{ label &&
					id &&
					( hideLabelFromVision ? (
						<VisuallyHidden as="label" htmlFor={ id }>
							{ label }
						</VisuallyHidden>
					) : (
						<Label
							className="components-base-control__label"
							htmlFor={ id }
						>
							{ label }
						</Label>
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
			</Field>
			{ !! help && (
				<Help
					id={ id + '__help' }
					className="components-base-control__help"
				>
					{ help }
				</Help>
			) }
		</Control>
	);
}

BaseControl.VisualLabel = ( { className, children } ) => {
	className = classnames( 'components-base-control__label', className );
	return (
		<Label className={ className } as="span">
			{ children }
		</Label>
	);
};

export default BaseControl;
