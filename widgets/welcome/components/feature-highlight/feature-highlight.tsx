/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Icon, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
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
				className={ styles.iconBox }
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
