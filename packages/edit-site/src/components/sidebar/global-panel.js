/**
 * Internal dependencies
 */
import { GLOBAL_CONTEXT } from '../editor/utils';
import TypographyPanel from './typography-panel';
import ColorPanel from './color-panel';

export default ( { context, getProperty, setProperty } ) => {
	const panels = [];
	const { supports } = context;

	panels.push(
		<TypographyPanel
			context={ { supports, name: GLOBAL_CONTEXT } }
			getProperty={ getProperty }
			setProperty={ setProperty }
		/>
	);

	panels.push(
		<ColorPanel
			context={ { supports, name: GLOBAL_CONTEXT } }
			getProperty={ getProperty }
			setProperty={ setProperty }
		/>
	);

	return panels.filter( Boolean );
};
