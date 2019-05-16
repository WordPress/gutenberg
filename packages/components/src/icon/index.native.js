/**
 * Internal dependencies
 */
import { SVG } from '../';

function Icon( { icon = null, style } ) {
	if ( icon && ( icon.type === SVG ) ) {
		const appliedProps = {
			style,
			...icon.props,
		};

		return <SVG { ...appliedProps } />;
	}

	return icon;
}

export default Icon;
