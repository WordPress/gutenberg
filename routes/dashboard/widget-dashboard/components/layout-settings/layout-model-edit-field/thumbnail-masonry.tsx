/**
 * WordPress dependencies
 */
import { SVG, Rect } from '@wordpress/primitives';

interface MasonryThumbnailProps {
	className?: string;
}

export function MasonryThumbnail( {
	className,
}: MasonryThumbnailProps ): React.ReactNode {
	return (
		<SVG
			className={ className }
			viewBox="0 0 40 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<Rect x="2" y="0.75" width="11" height="13" rx="1.5" />
			<Rect x="2" y="15.25" width="11" height="8" rx="1.5" />
			<Rect x="14.5" y="0.75" width="11" height="8" rx="1.5" />
			<Rect x="14.5" y="10.25" width="11" height="13" rx="1.5" />
			<Rect x="27" y="0.75" width="11" height="10" rx="1.5" />
			<Rect x="27" y="12.25" width="11" height="11" rx="1.5" />
		</SVG>
	);
}
