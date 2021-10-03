/**
 * WordPress dependencies
 */
import { useReducer } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils/hooks/use-cx';
import { NavigatorContext } from '../context';
import { gridDeck } from '../styles';

function locationReducer( holding, incoming ) {
	const isBack = incoming.isBack ?? holding.lastPath === incoming.path;
	return { ...incoming, isBack, lastPath: holding.path, isFirst: false };
}

function NavigatorProvider( { initialPath, children } ) {
	const [ location, navigate ] = useReducer( locationReducer, {
		path: initialPath,
		isFirst: true,
	} );

	return (
		<div className={ useCx()( gridDeck ) }>
			<NavigatorContext.Provider value={ [ location, navigate ] }>
				{ children }
			</NavigatorContext.Provider>
		</div>
	);
}

export default NavigatorProvider;
