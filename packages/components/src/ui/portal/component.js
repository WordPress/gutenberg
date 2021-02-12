/**
 * External dependencies
 */
import { ThemeProvider } from '@wp-g2/styles';
// eslint-disable-next-line no-restricted-imports
import { Portal as BasePortal } from 'reakit';

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<{}, never>} props
 */
/* eslint-enable jsdoc/valid-types */
function Portal( { children } ) {
	return (
		<BasePortal>
			<ThemeProvider>{ children }</ThemeProvider>
		</BasePortal>
	);
}

export default Portal;
