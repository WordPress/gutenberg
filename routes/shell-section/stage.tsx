import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { tool } from '@wordpress/icons';
import { EmptyState } from '@wordpress/ui';
import { getSectionTitles } from './sections';
import styles from './style.module.scss';

function SectionStage() {
	const { section } = useParams( { strict: false } ) as {
		section: string;
	};
	const title = getSectionTitles()[ section ];

	return (
		<Page title={ title }>
			<div className={ styles.placeholder }>
				<EmptyState.Root>
					<EmptyState.Icon icon={ tool } />
					<EmptyState.Title>{ title }</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'This screen is a placeholder in the site shell.'
						) }
					</EmptyState.Description>
				</EmptyState.Root>
			</div>
		</Page>
	);
}

export const stage = SectionStage;
