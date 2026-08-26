import { Path, SVG } from '@wordpress/components';
import HtmlRenderer from '../utils/html-renderer';
import { useIcon } from '../utils/use-icon';

export const ItemSubmenuIcon = () => {
	const { content, hasResolved } = useIcon( 'core/navigation-submenu' );

	if ( hasResolved && content ) {
		return <HtmlRenderer html={ content } />;
	}

	// Fallback for when the Icon Registry is not available.
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
		>
			<Path d="M1.50002 4L6.00002 8L10.5 4" strokeWidth="1.5" />
		</SVG>
	);
};
