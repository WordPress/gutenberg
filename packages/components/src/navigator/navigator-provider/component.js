/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils/hooks/use-cx';
import { NavigatorContext } from '../context';
import { gridDeck } from '../styles';

function NavigatorProvider( { initialPath, children } ) {
	const [ path, setPath ] = useState( { path: initialPath, isBack: false } );

	return (
		<div className={ useCx()( gridDeck ) }>
			<NavigatorContext.Provider value={ [ path, setPath ] }>
				{ children }
			</NavigatorContext.Provider>
		</div>
	);
}

export default NavigatorProvider;
