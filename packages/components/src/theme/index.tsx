/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';

/**
 * Internal dependencies
 */
import type { ThemeProps } from './types';
import type { WordPressComponentProps } from '../ui/context';
import { Wrapper } from './styles';

extend( [ namesPlugin, a11yPlugin ] );

function Theme( props: WordPressComponentProps< ThemeProps, 'div', true > ) {
	const { accent } = props;
	if ( accent && ! colord( accent ).isValid() ) {
		console.warn(
			`wp.components.Theme: "${ accent }" is not a valid color value for the 'accent' prop.`
		);
	}

	return <Wrapper { ...props } />;
}

export default Theme;
