/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

export default function ListViewListItem( {
	block,
	onClick,
	isSelected,
	wrapperComponent: WrapperComponent,
	children,
} ) {
	const blockType = getBlockType( block.name );
	const blockLabel = blockType
		? getBlockLabel( blockType, block.attributes )
		: null;

	return (
		<div className="block-editor-list-view__list-item">
			<WrapperComponent
				className={ classnames(
					'block-editor-list-view__list-item-button',
					{
						'is-selected': isSelected,
					}
				) }
				onClick={ onClick }
			>
				<BlockIcon icon={ blockType?.icon } showColors />
				{ children ? children : blockLabel }
				{ isSelected && (
					<VisuallyHidden as="span">
						{ __( '(selected block)' ) }
					</VisuallyHidden>
				) }
			</WrapperComponent>
		</div>
	);
}

ListViewListItem.defaultProps = {
	onClick: () => {},
	wrapperComponent: ( props ) => <Button { ...props } />,
};
