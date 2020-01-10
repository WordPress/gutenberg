/**
 * External dependencies
 */
import classnames from 'classnames';
import useResizeAware from 'react-resize-aware';

/**
 * Internal dependencies
 */
import Icon from '../icon';

/**
 * Renders a placeholder. Normally used by blocks to render their empty state.
 *
 * @param  {Object} props The component props.
 * @return {Object}       The rendered placeholder.
 */
function Placeholder( { icon, children, label, instructions, className, notices, preview, isColumnLayout, ...additionalProps } ) {
	const [ resizeListener, { width } ] = useResizeAware();
	const classes = classnames(
		'components-placeholder',
		( width >= 320 ? 'is-large' : '' ),
		( width >= 160 && width < 320 ? 'is-medium' : '' ),
		( width < 160 ? 'is-small' : '' ),
		className
	);
	const fieldsetClasses = classnames( 'components-placeholder__fieldset', { 'is-column-layout': isColumnLayout } );
	return (
		<div { ...additionalProps } className={ classes }>
			{ resizeListener }
			{ notices }
			{ preview &&
				<div className="components-placeholder__preview">
					{ preview }
				</div>
			}
			<div className="components-placeholder__label">
				<Icon icon={ icon } />
				{ label }
			</div>
			{ !! instructions && <div className="components-placeholder__instructions">{ instructions }</div> }
			<div className={ fieldsetClasses }>
				{ children }
			</div>
		</div>
	);
}

export default Placeholder;
