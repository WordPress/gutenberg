import { Card, Link, Stack, Text } from '@wordpress/ui';
import { AdminUIIllustration } from './admin-ui-illustration';
import { ComponentsIllustration } from './components-illustration';
import { DataViewsIllustration } from './dataviews-illustration';
import { IconsIllustration } from './icons-illustration';
import { ThemingIllustration } from './theming-illustration';
import styles from './style.module.scss';

const illustrations = {
	theming: ThemingIllustration,
	components: ComponentsIllustration,
	icons: IconsIllustration,
	dataviews: DataViewsIllustration,
	adminui: AdminUIIllustration,
};

export const PackageCard = ( {
	illustration,
	title,
	packageName,
	children,
	storybookId,
	docsHref,
}: {
	illustration: keyof typeof illustrations;
	title: string;
	packageName: string;
	children: React.ReactNode;
	storybookId: string;
	docsHref: string;
} ) => {
	const Art = illustrations[ illustration ];
	return (
		<Card.Root className={ `sb-unstyled ${ styles.card }` }>
			<Card.Content>
				<Card.FullBleed>
					<Art />
				</Card.FullBleed>
			</Card.Content>
			<Card.Content className={ styles.body }>
				<Stack direction="column" gap="md">
					<Stack direction="column" gap="xs">
						<Text variant="heading-lg" render={ <h4 /> }>
							{ title }
						</Text>
						<Text variant="body-sm" render={ <code /> }>
							{ packageName }
						</Text>
					</Stack>
					<Text variant="body-md" render={ <p /> }>
						{ children }
					</Text>
					<Text
						variant="body-md"
						render={
							<Stack direction="row" gap="lg" wrap="wrap" />
						}
					>
						<Link
							href={ `./?path=/docs/${ storybookId }` }
							target="_top"
						>
							Learn more about { title }
						</Link>
						<Link href={ docsHref }>
							Read the { title } package documentation
						</Link>
					</Text>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};
