/**
 * Internal dependencies
 */
import type { ThemeProps } from './types';
import type { WordPressComponentProps } from '../ui/context';
import { Wrapper } from './styles';

function Theme( props: WordPressComponentProps< ThemeProps, 'div', true > ) {
	return <Wrapper { ...props } />;
}

export default Theme;
