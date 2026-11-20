import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { ComponentType, ReactNode } from 'react';
import PatternOverridesControls from '../../hooks/pattern-overrides';
import NavigationViewButton, {
	SUPPORTED_BLOCKS as NAVIGATION_LINK_BLOCKS,
} from '../../hooks/navigation-link-view-button';
import TemplatePartNavigationEditButton, {
	TEMPLATE_PART_BLOCK_NAME,
} from '../../hooks/template-part-navigation-edit-button';
import PushChangesToGlobalStyles from '../../hooks/push-changes-to-global-styles';
import { unlock } from '../../lock-unlock';

type BlockEditProps = {
	name: string;
	clientId: string;
	attributes: Record< string, unknown >;
};

const { SelectedBlockEditControls } = unlock( blockEditorPrivateApis ) as {
	SelectedBlockEditControls: ComponentType< {
		children: ( props: BlockEditProps ) => ReactNode;
	} >;
};

/**
 * The editor's controls for the selected block, rendered next to it.
 */
export default function BlockEditControls() {
	return (
		<SelectedBlockEditControls>
			{ ( props ) => (
				<>
					<PatternOverridesControls { ...props } />
					{ NAVIGATION_LINK_BLOCKS.includes( props.name ) && (
						<NavigationViewButton { ...props } />
					) }
					{ props.name === TEMPLATE_PART_BLOCK_NAME && (
						<TemplatePartNavigationEditButton
							clientId={ props.clientId }
						/>
					) }
					<PushChangesToGlobalStyles { ...props } />
				</>
			) }
		</SelectedBlockEditControls>
	);
}
