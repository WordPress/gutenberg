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
import { DEFAULT_LEVEL } from './utils';
import { Root } from './styles/navigation-styles';

export default function Navigation( {
	children,
	activeItem,
	activeLevel = DEFAULT_LEVEL,
	setActiveItem = noop,
	setActiveLevel = noop,
} ) {
	const [ item, setItem ] = useState( activeItem );
	const [ level, setLevel ] = useState( activeLevel );
	const [ slideOrigin, setSlideOrigin ] = useState();

	const activateItem = ( itemId ) => {
		setItem( itemId );
		setActiveItem( itemId );
	};

	const activateLevel = ( levelId, slideInOrigin = 'left' ) => {
		setSlideOrigin( slideInOrigin );
		setLevel( levelId );
		setActiveLevel( levelId );
	};

	const isMounted = useRef( false );
	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	useEffect( () => {
		if ( activeItem !== item ) {
			activateItem( activeItem );
		}
		if ( activeLevel !== level ) {
			activateLevel( activeLevel );
		}
	}, [ activeItem, activeLevel ] );

	const context = {
		activeItem: item,
		activeLevel: level,
		setActiveItem: activateItem,
		setActiveLevel: activateLevel,
	};

	return (
		<Root className="components-navigation">
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
