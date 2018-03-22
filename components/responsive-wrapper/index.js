/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import {cloneElement, Children} from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

function ResponsiveWrapper({naturalWidth, naturalHeight, children}) {
    if (Children.count(children) !== 1) {
        return null;
    }
    const hasFiniteDimensions = (
        Number.isInteger( naturalHeight ) &&
        Number.isInteger( naturalWidth )
    );

    let paddingBottom;
    if ( hasFiniteDimensions ) {
        paddingBottom = ( naturalHeight / naturalWidth * 100 ) + '%';
    }
    const classes = classnames( 'components-responsive-wrapper', {
        'has-finite-dimensions': hasFiniteDimensions,
    } );

    return (
        <div className={ classes } >
            <div style={ { paddingBottom } } />
            { cloneElement(children, {
                className: classnames('components-responsive-wrapper__content', children.props.className),
            }) }
        </div>
    );
}

export default ResponsiveWrapper;
