import { SVG } from '@wordpress/primitives';

export default function getIconContent( iconType ) {
	switch ( iconType ) {
		case 'chevron':
			return (
				<SVG
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<polyline points="9 6 15 12 9 18" />
				</SVG>
			);
		case 'arrow':
			return (
				<SVG
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<polyline points="19 12 12 19 5 12" />
				</SVG>
			);
		case 'plus':
		default:
			return '+';
	}
}
