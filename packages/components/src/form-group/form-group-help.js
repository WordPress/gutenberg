/**
 * External dependencies
 */
import { ContextSystemProvider } from '@wp-g2/context';
/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

const contextValue = { Text: { variant: 'muted' } };

function FormGroupHelp( { children } ) {
	if ( ! children ) return null;

	return (
		<ContextSystemProvider value={ contextValue }>
			{ children }
		</ContextSystemProvider>
	);
}

export default memo( FormGroupHelp );
