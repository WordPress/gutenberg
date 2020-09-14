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
import { Button, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { getBlockPositionDescription } from './utils';

function BlockNavigationBlockSelectButton(
	{
		className,
		block,
		isSelected,
		onClick,
		position,
		siblingBlockCount,
		level,
		tabIndex,
		onFocus,
		onDragStart,
		onDragEnd,
		draggable,
	},
	ref
) {
	const { name, attributes } = block;

	const blockType = getBlockType( name );
	const blockDisplayName = getBlockLabel( blockType, attributes );
	const instanceId = useInstanceId( BlockNavigationBlockSelectButton );
	const descriptionId = `block-navigation-block-select-button__${ instanceId }`;
	const blockPositionDescription = getBlockPositionDescription(
		position,
		siblingBlockCount,
		level
	);

	return (
		<>
			<Button
				className={ classnames(
					'block-editor-block-navigation-block-select-button',
					className
				) }
				onClick={ onClick }
				aria-describedby={ descriptionId }
				ref={ ref }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onDragStart={ onDragStart }
				onDragEnd={ onDragEnd }
				draggable={ draggable }
			>
				<BlockIcon icon={ blockType.icon } showColors />
				{ blockDisplayName }
				{ isSelected && (
					<VisuallyHidden>
						{ __( '(selected block)' ) }
					</VisuallyHidden>
				) }
			</Button>
			<div
				className="block-editor-block-navigation-block-select-button__description"
				id={ descriptionId }
			>
				{ blockPositionDescription }
			</div>
		</>
	);
}

export default forwardRef( BlockNavigationBlockSelectButton );
