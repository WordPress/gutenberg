/**
 * Internal dependencies
 */
import {
	VIEW_COLORS,
	VIEW_COLORS_ELEMENT,
	VIEW_COLORS_PALETTE,
	VIEW_ROOT,
	VIEW_TYPOGRAPHY,
	VIEW_TYPOGRAPHY_ELEMENT,
} from './constants';
import { useGlobalStylesNavigationContext } from './context';
import GlobalStylesViewColors from '../views/colors';
import GlobalStylesViewColorsElement from '../views/colors-element';
import GlobalStylesViewColorsPalette from '../views/colors-palette';
import GlobalStylesViewRoot from '../views/root';
import GlobalStylesViewTypography from '../views/typography';
import GlobalStylesViewTypographyElement from '../views/typography-element';

const allViews = {
	[ VIEW_ROOT ]: GlobalStylesViewRoot,
	[ VIEW_COLORS ]: GlobalStylesViewColors,
	[ VIEW_COLORS_ELEMENT ]: GlobalStylesViewColorsElement,
	[ VIEW_COLORS_PALETTE ]: GlobalStylesViewColorsPalette,
	[ VIEW_TYPOGRAPHY ]: GlobalStylesViewTypography,
	[ VIEW_TYPOGRAPHY_ELEMENT ]: GlobalStylesViewTypographyElement,
};

export default function GlobalStylesCurrentView() {
	const { currentView } = useGlobalStylesNavigationContext();
	const CurrentView = allViews[ currentView ] ?? null;

	return (
		<div style={ { padding: '20px 0' } }>
			<CurrentView />
		</div>
	);
}
