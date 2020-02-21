/**
 * Internal dependencies
 */
import TypographyControls from './typography-controls';
import { useGlobalStylesContext } from '../provider';

export function GlobalStylesControls() {
	const { typography, setTypography } = useGlobalStylesContext();

	if ( typography === undefined ) {
		return null;
	}

	return (
		<TypographyControls
			typography={ typography }
			setTypography={ setTypography }
		/>
	);
}
