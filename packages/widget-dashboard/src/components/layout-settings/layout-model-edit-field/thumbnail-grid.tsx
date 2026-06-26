/**
 * WordPress dependencies
 */
import { SVG, Rect } from '@wordpress/primitives';

interface GridThumbnailProps {
	className?: string;
}

export function GridThumbnail( {
	className,
}: GridThumbnailProps ): React.ReactNode {
	return (
		<SVG
			className={ className }
			viewBox="0 0 40 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<Rect x="2" y="1.25" width="11" height="10" rx="1.5" />
			<Rect x="14.5" y="1.25" width="11" height="10" rx="1.5" />
			<Rect x="27" y="1.25" width="11" height="10" rx="1.5" />
			<Rect x="2" y="12.75" width="11" height="10" rx="1.5" />
			<Rect x="14.5" y="12.75" width="11" height="10" rx="1.5" />
			<Rect x="27" y="12.75" width="11" height="10" rx="1.5" />
		</SVG>
	);
}
