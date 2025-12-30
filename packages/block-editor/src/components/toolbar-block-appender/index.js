/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import __unstableBlockToolbarLastItem from '../block-toolbar/block-toolbar-last-item';
import { useBlockEditContext } from '../block-edit/context';
import Inserter from '../inserter';

function ToolbarBlockAppender( {
	defaultBlock = { name: 'core/paragraph', attributes: {} },
} ) {
	const { clientId } = useBlockEditContext();

	const directInsertBlock = {
		name: defaultBlock.name,
		attributes: defaultBlock.attributes,
	};

	return (
		<__unstableBlockToolbarLastItem>
			<ToolbarGroup className="block-editor-toolbar-block-appender">
				<Inserter
					rootClientId={ clientId }
					directInsertBlock={ directInsertBlock }
					isAppender
					toggleProps={ {
						as: ToolbarButton,
						name: 'add-block',
						label: __( 'Add block' ),
						showTooltip: true,
						className:
							'wp-block-navigation__toolbar-inserter-button',
					} }
					__experimentalIsQuick
				/>
			</ToolbarGroup>
		</__unstableBlockToolbarLastItem>
	);
}
export default ToolbarBlockAppender;
