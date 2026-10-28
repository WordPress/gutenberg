import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { tool } from '@wordpress/icons';
import { EmptyState } from '@wordpress/ui';
import { getSectionTitles } from './sections';

function SectionStage() {
	const { section } = useParams( { strict: false } ) as {
		section: string;
	};
	const title = getSectionTitles()[ section ];

	return (
		<Page title={ title } hasPadding>
			<EmptyState.Root>
				<EmptyState.Icon icon={ tool } />
				<EmptyState.Title>{ title }</EmptyState.Title>
				<EmptyState.Description>
					{ __( 'This screen is a placeholder in the site shell.' ) }
				</EmptyState.Description>
			</EmptyState.Root>
		</Page>
	);
}

export const stage = SectionStage;
