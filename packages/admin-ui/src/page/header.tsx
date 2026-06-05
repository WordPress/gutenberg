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
		<Stack direction="column" className={ styles.header }>
			<Stack
				className={ styles[ 'header-content' ] }
				direction="row"
				gap="sm"
				justify="space-between"
			>
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
				{ actions && (
					<Stack
						align="center"
						className={ styles[ 'header-actions' ] }
						direction="row"
						gap="sm"
					>
						{ actions }
					</Stack>
				) }
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
