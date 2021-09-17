/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './navigator-styles';
import {
	contextConnect,
	ContextSystemProvider,
	hasConnectNamespace,
	useContextSystem,
} from '../ui/context';
import { NavLink, useHistory } from './router';

function NavigatorLink( props, forwardedRef ) {
	/* eslint-disable no-unused-vars */
	const {
		as,
		children,
		className,
		exact,
		href,
		isBack,
		isPlain,
		params,
		showArrow,
		to,
		...otherProps
	} = useContextSystem( props, 'NavigatorLink' );
	/* eslint-enable no-unused-vars */

	const history = useHistory();
	const [ child ] = Children.toArray( children );
	const isWrappingMenuItem = hasConnectNamespace( child, [ 'MenuItem' ] );

	const isLink = !! to || !! href;

	const classes = classNames( {
		[ styles.menuItemLink ]: isWrappingMenuItem,
		className,
	} );

	const handleOnClick = ( event ) => {
		if ( isBack ) {
			event.preventDefault();
			if ( to ) {
				history.push( to, { isBack: true } );
			} else {
				history.goBack();
			}
		}
	};

	const content = (
		<ContextSystemProvider
			value={ {
				MenuItem: {
					isBack,
					showArrow: isLink || showArrow,
					tabIndex: -1,
				},
			} }
		>
			{ children }
		</ContextSystemProvider>
	);

	if ( ! to ) {
		return (
			<a
				href={ href || '#' }
				ref={ forwardedRef }
				{ ...otherProps }
				className={ classes }
				onClick={ handleOnClick }
			>
				{ content }
			</a>
		);
	}

	return (
		<NavLink
			{ ...otherProps }
			activeClassName="is-active"
			className={ classes }
			exact={ exact }
			onClick={ handleOnClick }
			ref={ forwardedRef }
			to={ to }
		>
			{ content }
		</NavLink>
	);
}

export default contextConnect( NavigatorLink, 'NavigatorLink' );
