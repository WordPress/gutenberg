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
import useBlockDisplayInformation from '../use-block-display-information';
import { getBlockPositionDescription } from './utils';

function BlockNavigationBlockSelectButton(
	{
		className,
		block: { clientId, name, attributes },
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
	const blockInformation = useBlockDisplayInformation( clientId );
	const instanceId = useInstanceId( BlockNavigationBlockSelectButton );
	const descriptionId = `block-navigation-block-select-button__${ instanceId }`;
	const blockType = getBlockType( name );
	const blockLabel = getBlockLabel( blockType, attributes );
	// If label is defined we prioritize it over possible possible
	// block variation match title.
	const blockDisplayName =
		blockLabel !== blockType.title ? blockLabel : blockInformation?.title;
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
				<BlockIcon icon={ blockInformation.icon } showColors />
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
