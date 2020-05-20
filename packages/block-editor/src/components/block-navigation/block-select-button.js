/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import {
	Button,
	__experimentalTreeGridItem as TreeGridItem,
	VisuallyHidden,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { getBlockPositionDescription } from './utils';

export default function BlockNavigationBlockSelectButton( {
	className,
	block,
	isSelected,
	onClick,
	position,
	siblingCount,
	level,
} ) {
	const { name, attributes } = block;

	const blockType = getBlockType( name );
	const blockDisplayName = getBlockLabel( blockType, attributes );
	const instanceId = useInstanceId( BlockNavigationBlockSelectButton );
	const descriptionId = `block-navigation-block-select-button__${ instanceId }`;
	const blockPositionDescription = getBlockPositionDescription(
		position,
		siblingCount,
		level
	);

	return (
		<>
			<TreeGridItem
				as={ Button }
				className={ classnames(
					'block-editor-block-navigation-block-select-button',
					className
				) }
				onClick={ onClick }
				aria-describedby={ descriptionId }
			>
				<BlockIcon icon={ blockType.icon } showColors />
				{ blockDisplayName }
				{ isSelected && (
					<VisuallyHidden>
						{ __( '(selected block)' ) }
					</VisuallyHidden>
				) }
			</TreeGridItem>
			<div
				className="block-editor-block-navigation-block-select-button__description"
				id={ descriptionId }
			>
				{ blockPositionDescription }
			</div>
		</>
	);
}
