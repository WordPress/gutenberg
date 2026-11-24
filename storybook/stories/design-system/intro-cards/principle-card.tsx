import { Card, Stack, Text } from '@wordpress/ui';
import styles from './style.module.scss';

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
