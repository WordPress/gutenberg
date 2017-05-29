/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { cloneElement } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';

function ResponsiveWrapper( { naturalWidth, naturalHeight, children } ) {
	if ( ! children || Array.isArray( children ) ) {
		return null;
	}
	const imageStyle = {
		paddingBottom: ( naturalHeight / naturalWidth * 100 ) + '%',
	};
	return (
		<div className="components-responsive-wrapper">
			<div style={ imageStyle } />
			{ cloneElement( children, {
				className: classnames( 'components-responsive-wrapper__content', children.props.className ),
			} ) }
		</div>
	);
}

export default ResponsiveWrapper;
