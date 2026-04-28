/**
 * WordPress dependencies
 */
import { Stack, Text } from '@wordpress/ui';

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
						<Text
							className={ styles[ 'header-title' ] }
							render={ <HeadingTag /> }
							variant="heading-lg"
						>
							{ title }
						</Text>
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
				<Text
					render={ <p /> }
					variant="body-md"
					className={ styles[ 'header-subtitle' ] }
				>
					{ subTitle }
				</Text>
			) }
		</Stack>
	);
}
