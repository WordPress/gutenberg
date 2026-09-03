import clsx from 'clsx';
import { Stack, Text } from '@wordpress/ui';
import Navigation from '../navigation';
import type { NavigationConfig } from '../navigation/types';
import { SidebarToggleSlot } from './sidebar-toggle-slot';
import type { PageComponents } from './types';
import styles from './style.module.css';

export default function Header( {
	headingLevel = 1,
	breadcrumbs,
	badges,
	visual,
	title,
	subTitle,
	actions,
	navigation,
	components,
	showSidebarToggle = true,
}: {
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	visual?: React.ReactNode;
	title?: React.ReactNode;
	subTitle: React.ReactNode;
	actions?: React.ReactNode;
	navigation?: NavigationConfig;
	components?: PageComponents;
	showSidebarToggle?: boolean;
} ) {
	const HeadingTag = `h${ headingLevel }` as const;
	const hasNavigation = !! navigation?.items?.length;

	return (
		<Stack
			direction="column"
			className={ clsx(
				styles.header,
				hasNavigation && styles[ 'has-navigation' ]
			) }
		>
			<Stack
				className={ styles[ 'header-content' ] }
				direction="row"
				gap="sm"
				justify="space-between"
			>
				<Stack
					direction="row"
					gap="sm"
					align="center"
					justify="start"
					className={ styles[ 'header-lockup' ] }
				>
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

			{ hasNavigation && (
				<Navigation
					{ ...navigation }
					linkComponent={ components?.link }
					className={ styles[ 'header-navigation' ] }
				/>
			) }
		</Stack>
	);
}
