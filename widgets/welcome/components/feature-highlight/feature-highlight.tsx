import type { ReactNode } from 'react';
import { Icon, Link, Stack, Text } from '@wordpress/ui';
import styles from './feature-highlight.module.css';

type IconType = React.ComponentProps< typeof Icon >[ 'icon' ];

interface FeatureHighlightProps {
	icon: IconType;
	title: ReactNode;
	description: ReactNode;
	ctaUrl: string;
	ctaLabel: ReactNode;
}

export function FeatureHighlight( {
	icon,
	title,
	description,
	ctaUrl,
	ctaLabel,
}: FeatureHighlightProps ) {
	return (
		<Stack direction="row" gap="lg" align="start">
			<Stack
				className={ styles[ 'icon-box' ] }
				direction="column"
				align="center"
				justify="center"
			>
				<Icon icon={ icon } />
			</Stack>

			<Stack direction="column" gap="sm">
				<Text variant="heading-md" render={ <h3 /> }>
					{ title }
				</Text>
				<Text render={ <p /> }>{ description }</Text>
				<Link href={ ctaUrl }>{ ctaLabel }</Link>
			</Stack>
		</Stack>
	);
}
