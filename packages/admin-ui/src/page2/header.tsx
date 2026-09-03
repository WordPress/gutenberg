import clsx from 'clsx';
import { Badge, Stack, Text } from '@wordpress/ui';
import Navigation from '../navigation';
import type { NavigationConfig } from '../navigation/types';
import Page2Breadcrumbs from './breadcrumbs';
import Page2ActionsGroup from './actions';
import type { Page2Actions, Page2Badge, Page2BreadcrumbItem } from './types';
import styles from './style.module.css';

export default function Header2( {
	headingLevel = 1,
	breadcrumbs,
	badges,
	visual,
	title,
	description,
	navigation,
	actions,
}: {
	headingLevel?: 1 | 2;
	breadcrumbs?: Page2BreadcrumbItem[];
	badges?: Page2Badge[];
	visual?: React.ReactNode;
	title?: string;
	description?: string;
	navigation?: NavigationConfig;
	actions?: Page2Actions;
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
				direction="row"
				gap="sm"
				justify="space-between"
				className={ styles[ 'header-content' ] }
			>
				<Stack
					direction="row"
					gap="sm"
					align="center"
					className={ styles[ 'header-lockup' ] }
				>
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
					{ !! breadcrumbs?.length && (
						<Page2Breadcrumbs items={ breadcrumbs } />
					) }
					{ badges?.map( ( badge, index ) => (
						<Badge key={ index } intent={ badge.intent }>
							{ badge.label }
						</Badge>
					) ) }
				</Stack>
				{ actions && <Page2ActionsGroup actions={ actions } /> }
			</Stack>
			{ description && (
				<Text
					render={ <p /> }
					variant="body-md"
					className={ styles[ 'header-subtitle' ] }
				>
					{ description }
				</Text>
			) }

			{ hasNavigation && (
				<Navigation
					{ ...navigation }
					className={ styles[ 'header-navigation' ] }
				/>
			) }
		</Stack>
	);
}
