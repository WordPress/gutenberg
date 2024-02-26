/**
 * WordPress dependencies
 */
import { Icon, layout } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { Flex, FlexItem, FlexBlock, PanelBody } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';

function TemplateSummary() {
	const template = useSelect( ( select ) => {
		const { getCurrentPost } = select( editorStore );
		return getCurrentPost();
	}, [] );

	if ( ! template ) {
		return null;
	}

	return (
		<PanelBody>
			<Flex align="flex-start" gap="3">
				<FlexItem>
					<Icon icon={ layout } />
				</FlexItem>

				<FlexBlock>
					<h2 className="edit-post-template-summary__title">
						{ template?.title || template?.slug }
					</h2>
					<p>{ template?.description }</p>
				</FlexBlock>
			</Flex>
		</PanelBody>
	);
}

export default TemplateSummary;
