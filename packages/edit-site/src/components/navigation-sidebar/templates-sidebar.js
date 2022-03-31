/**
 * WordPress dependencies
 */
import { FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DefaultSidebar from '../sidebar/default-sidebar';
import TemplateList from './template-list';
import AddNewTemplate from '../add-new-template';

export default function TemplatesSidebar() {
	return (
		<DefaultSidebar
			className="edit-site-templates-sidebar"
			scope="core/edit-global"
			identifier="edit-global/templates"
			title={ __( 'Templates' ) }
			icon={ layout }
			closeLabel={ __( 'Close templates sidebar' ) }
			panelClassName="edit-site-templates-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Templates' ) }</strong>
					</FlexBlock>
					<FlexBlock>
						<AddNewTemplate templateType="wp_template" />
					</FlexBlock>
				</Flex>
			}
		>
			<TemplateList templateType="wp_template" />
		</DefaultSidebar>
	);
}
