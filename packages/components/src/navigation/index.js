/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Animate from '../animate';
import { NavigationContext } from './context';
import { ROOT_LEVEL } from './constants';
import { Root } from './styles/navigation-styles';

export default function Navigation( {
	activeItem,
	activeLevel = ROOT_LEVEL,
	children,
	className,
	onActivateItem = noop,
	onActivateLevel = noop,
} ) {
	const [ item, setItem ] = useState( activeItem );
	const [ level, setLevel ] = useState( activeLevel );
	const [ slideOrigin, setSlideOrigin ] = useState();

	const setActiveItem = ( itemId ) => {
		setItem( itemId );
		onActivateItem( itemId );
	};

	const setActiveLevel = ( levelId, slideInOrigin = 'left' ) => {
		setSlideOrigin( slideInOrigin );
		setLevel( levelId );
		onActivateLevel( levelId );
	};

	const isMounted = useRef( false );
	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	useEffect( () => {
		if ( activeItem !== item ) {
			setActiveItem( activeItem );
		}
		if ( activeLevel !== level ) {
			setActiveLevel( activeLevel );
		}
	}, [ activeItem, activeLevel ] );

	const context = {
		activeItem: item,
		activeLevel: level,
		setActiveItem,
		setActiveLevel,
	};

	const classes = classnames( 'components-navigation', className );

	return (
		<Root className={ classes }>
			<Animate
				key={ level }
				type="slide-in"
				options={ { origin: slideOrigin } }
			>
				{ ( { className: animateClassName } ) => (
					<div
						className={ classnames( {
							[ animateClassName ]:
								isMounted.current && slideOrigin,
						} ) }
					>
						<NavigationContext.Provider value={ context }>
							{ children }
						</NavigationContext.Provider>
					</div>
				) }
			</Animate>
		</Root>
	);
}
