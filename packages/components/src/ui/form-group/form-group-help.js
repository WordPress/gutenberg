/**
 * External dependencies
 */
import { ContextSystemProvider } from '@wp-g2/context';
/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

const contextValue = { Text: { variant: 'muted' } };

/**
 * @typedef Props
 * @property {import('react').ReactNode} [children] The content to display within `FormGroupHelp`.
 */

/**
 *
 * @param {Props} props
 */
function FormGroupHelp( { children } ) {
	if ( ! children ) return null;

	return (
		<ContextSystemProvider value={ contextValue }>
			{ children }
		</ContextSystemProvider>
	);
}

export default memo( FormGroupHelp );
