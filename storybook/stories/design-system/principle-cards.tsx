import { Card, Stack, Text } from '@wordpress/ui';
import styles from './package-cards.module.scss';

export const PrincipleCard = ( {
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
} ) => (
	<Card.Root className={ `sb-unstyled ${ styles[ 'principle-card' ] }` }>
		<Card.Content>
			<Stack direction="column" gap="md">
				<Text variant="heading-md" render={ <h4 /> }>
					{ title }
				</Text>
				<Text variant="body-md" render={ <p /> }>
					{ children }
				</Text>
			</Stack>
		</Card.Content>
	</Card.Root>
);

export const PrincipleCards = ( {
	children,
}: {
	children: React.ReactNode;
} ) => (
	<Stack
		direction="row"
		gap="lg"
		wrap="wrap"
		className={ styles[ 'card-group' ] }
	>
		{ children }
	</Stack>
);
