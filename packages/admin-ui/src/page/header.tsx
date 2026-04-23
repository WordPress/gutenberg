/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { SidebarToggleSlot } from './sidebar-toggle-slot';
import styles from './style.module.css';

export default function Header( {
	headingLevel = 1,
	breadcrumbs,
	badges,
	visual,
	title,
	subTitle,
	actions,
	showSidebarToggle = true,
}: {
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	visual?: React.ReactNode;
	title?: React.ReactNode;
	subTitle: React.ReactNode;
	actions?: React.ReactNode;
	showSidebarToggle?: boolean;
} ) {
	const HeadingTag = `h${ headingLevel }` as const;
	return (
		<Stack
			direction="column"
			className={ styles.header }
			render={ <header /> }
		>
			<Stack direction="row" justify="space-between" gap="sm">
				<Stack direction="row" gap="sm" align="center" justify="start">
					{ showSidebarToggle && (
						<SidebarToggleSlot
							bubblesVirtually
							className={ styles[ 'sidebar-toggle-slot' ] }
						/>
					) }
					{ visual && (
						<div
							className={ styles[ 'header-visual' ] }
							aria-hidden="true"
						>
							{ visual }
						</div>
					) }
					{ title && (
						<HeadingTag className={ styles[ 'header-title' ] }>
							{ title }
						</HeadingTag>
					) }
					{ breadcrumbs }
					{ badges }
				</Stack>
				<Stack
					direction="row"
					gap="sm"
					style={ { width: 'auto', flexShrink: 0 } }
					className={ styles[ 'header-actions' ] }
					align="center"
				>
					{ actions }
				</Stack>
			</Stack>
			{ subTitle && (
				<p className={ styles[ 'header-subtitle' ] }>{ subTitle }</p>
			) }
		</Stack>
	);
}
