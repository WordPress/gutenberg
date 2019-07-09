/**
 * External dependencies
 */
import classnames from 'classnames';

function BaseControl( { id, label, hideLabelFromVision, help, className, children } ) {
	return (
		<div className={ classnames( 'components-base-control', className ) }>
			<div className="components-base-control__field">
				{ label && id && <label
					className={ classnames( 'components-base-control__label', { 'screen-reader-text': hideLabelFromVision } ) }
					htmlFor={ id }>{ label }
				</label> }
				{ label && ! id && <BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel> }
				{ children }
			</div>
			{ !! help && <p id={ id + '__help' } className="components-base-control__help">{ help }</p> }
		</div>
	);
}

BaseControl.VisualLabel = ( { className, children } ) => {
	className = classnames( 'components-base-control__label', className );
	return (
		<span className={ className }>
			{ children }
		</span>
	);
};

export default BaseControl;
