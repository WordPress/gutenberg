import { Link } from '@wordpress/ui';
import type { ReactNode } from 'react';

const BUTTON_STYLE = {
	background: 'none',
	border: 0,
	padding: 0,
	font: 'inherit',
	cursor: 'pointer',
	textDecoration: 'underline',
} as const;

/**
 * A link within a sentence that does something on the page, like opening a
 * dialog, rather than going somewhere: a button that looks like a link.
 *
 * @param props
 * @param props.onClick  What it does.
 * @param props.children The link text.
 */
export default function InlineActionLink( {
	onClick,
	children,
}: {
	onClick?: () => void;
	children?: ReactNode;
} ) {
	return (
		<Link
			tone="neutral"
			render={
				<button
					type="button"
					onClick={ onClick }
					style={ BUTTON_STYLE }
				/>
			}
		>
			{ children }
		</Link>
	);
}
