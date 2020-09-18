/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';

function BaseControl( {
	id,
	label,
	hideLabelFromVision,
	help,
	className,
	children,
} ) {
	return (
		<div className={ classnames( 'components-base-control', className ) }>
			<div className="components-base-control__field">
				{ label &&
					id &&
					( hideLabelFromVision ? (
						<VisuallyHidden as="label" htmlFor={ id }>
							{ label }
						</VisuallyHidden>
					) : (
						<label
							className="components-base-control__label"
							htmlFor={ id }
						>
							{ label }
						</label>
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
			</div>
			{ !! help && (
				<p
					id={ id + '__help' }
					className="components-base-control__help"
				>
					{ help }
				</p>
			) }
		</div>
	);
}

BaseControl.VisualLabel = ( { className, children } ) => {
	className = classnames( 'components-base-control__label', className );
	return <span className={ className }>{ children }</span>;
};

export default BaseControl;
