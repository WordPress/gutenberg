import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import type { ComponentType } from 'react';
import PatternOverridesControls from './pattern-overrides';
import NavigationViewButton, {
	SUPPORTED_BLOCKS as NAVIGATION_LINK_BLOCKS,
} from './navigation-link-view-button';
import TemplatePartNavigationEditButton, {
	TEMPLATE_PART_BLOCK_NAME,
} from './template-part-navigation-edit-button';
import PushChangesToGlobalStyles from './push-changes-to-global-styles';

type BlockEditProps = {
	name: string;
	clientId: string;
	isSelected: boolean;
	attributes: Record< string, unknown >;
};

// One filter for all of the editor's controls of the selected block, since
// each filter wraps every block in another component.
const withBlockEditControls = createHigherOrderComponent(
	( BlockEdit: ComponentType< BlockEditProps > ) =>
		( props: BlockEditProps ) => (
			<>
				<BlockEdit key="edit" { ...props } />
				{ props.isSelected && (
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
			</>
		),
	'withBlockEditControls'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/block-edit-controls',
	withBlockEditControls
);
