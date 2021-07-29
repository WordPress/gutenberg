/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
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
import BlockTitle from '../block-title';
import ListViewExpander from './expander';

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
		isSelected,
		onClick,
		onToggleExpanded,
		position,
		siblingBlockCount,
		level,
		tabIndex,
		onFocus,
	},
	ref
) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const instanceId = useInstanceId( ListViewBlockSelectButton );
	const descriptionId = `list-view-block-select-button__${ instanceId }`;
	const blockPositionDescription = getBlockPositionDescription(
		position,
		siblingBlockCount,
		level
	);

	return (
		<>
			<Button
				className={ classnames(
					'block-editor-list-view-block-select-button',
					className
				) }
				onClick={ onClick }
				aria-describedby={ descriptionId }
				ref={ ref }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
			>
				<ListViewExpander onClick={ onToggleExpanded } />
				<BlockIcon icon={ blockInformation?.icon } showColors />
				<span className="block-editor-list-view-block-select-button__title">
					<BlockTitle clientId={ clientId } />
				</span>
				{ blockInformation?.anchor && (
					<span className="block-editor-list-view-block-select-button__anchor">
						{ blockInformation.anchor }
					</span>
				) }
				{ isSelected && (
					<VisuallyHidden>
						{ __( '(selected block)' ) }
					</VisuallyHidden>
				) }
			</Button>
			<div
				className="block-editor-list-view-block-select-button__description"
				id={ descriptionId }
			>
				{ blockPositionDescription }
			</div>
		</>
	);
}

export default forwardRef( ListViewBlockSelectButton );
