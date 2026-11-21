import type { AnchorHTMLAttributes } from 'react';
import { Link } from '@wordpress/route';

export const SECTIONS = [
	{ label: 'Main section', href: '/settings' },
	{ label: 'General section', href: '/settings/general' },
];

export function SectionLink( {
	href,
	...props
}: AnchorHTMLAttributes< HTMLAnchorElement > & { href: string } ) {
	return <Link to={ href } { ...props } />;
}
