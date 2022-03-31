/**
 * WordPress dependencies
 */
import { FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { sidebar } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DefaultSidebar from '../sidebar/default-sidebar';
import TemplateList from './template-list';
import AddNewTemplate from '../add-new-template';

export default function PartsSidebar() {
	return (
		<DefaultSidebar
			className="edit-site-templates-sidebar"
			scope="core/edit-global"
			identifier="edit-global/parts"
			title={ __( 'Parts' ) }
			icon={ sidebar }
			closeLabel={ __( 'Close parts sidebar' ) }
			panelClassName="edit-site-parts-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Parts' ) }</strong>
					</FlexBlock>
					<FlexBlock>
						<AddNewTemplate templateType="wp_template_part" />
					</FlexBlock>
				</Flex>
			}
		>
			<TemplateList templateType="wp_template_part" />
		</DefaultSidebar>
	);
}
