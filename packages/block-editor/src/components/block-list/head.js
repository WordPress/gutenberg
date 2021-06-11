/**
 * WordPress dependencies
 */
import { createContext, useState } from '@wordpress/element';

const context = createContext();

export function Head( { children } ) {
	const [ element, setElement ] = useState();
	return (
		<context.Provider value={ element }>
			<div ref={ setElement } style={ { display: 'none' } } />
			{ element && children }
		</context.Provider>
	);
}

Head.context = context;
