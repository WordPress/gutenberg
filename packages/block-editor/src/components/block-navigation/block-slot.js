/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { Fill, Slot, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	Children,
	cloneElement,
	forwardRef,
	useContext,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { BlockListBlockContext } from '../block-list/block';
import BlockNavigationBlockSelectButton from './block-select-button';
import { getBlockPositionDescription } from './utils';

const getSlotName = ( clientId ) => `BlockNavigationBlock-${ clientId }`;

export default forwardRef( function BlockNavigationBlockSlot( props, ref ) {
	const instanceId = useInstanceId( BlockNavigationBlockSlot );
	const { clientId } = props.block;

	return (
		<Slot name={ getSlotName( clientId ) }>
			{ ( fills ) => {
				if ( ! fills.length ) {
					return (
						<BlockNavigationBlockSelectButton
							ref={ ref }
							{ ...props }
						/>
					);
				}

				const {
					className,
					block,
					isSelected,
					position,
					siblingCount,
					level,
					tabIndex,
					onFocus,
				} = props;

				const { name } = block;
				const blockType = getBlockType( name );
				const descriptionId = `block-navigation-block-slot__${ instanceId }`;
				const blockPositionDescription = getBlockPositionDescription(
					position,
					siblingCount,
					level
				);

				const forwardedFillProps = {
					// Ensure that the component in the slot can receive
					// keyboard navigation.
					tabIndex,
					onFocus,
					ref,
					// Give the element rendered in the slot a description
					// that describes its position.
					'aria-describedby': descriptionId,
				};

				return (
					<>
						<div
							className={ classnames(
								'block-editor-block-navigation-block-slot',
								className
							) }
						>
							<BlockIcon icon={ blockType.icon } showColors />
							{ Children.map( fills, ( fill ) =>
								cloneElement( fill, {
									...fill.props,
									...forwardedFillProps,
								} )
							) }
							{ isSelected && (
								<VisuallyHidden>
									{ __( '(selected block)' ) }
								</VisuallyHidden>
							) }
							<div
								className="block-editor-block-navigation-block-slot__description"
								id={ descriptionId }
							>
								{ blockPositionDescription }
							</div>
						</div>
					</>
				);
			} }
		</Slot>
	);
} );

export const BlockNavigationBlockFill = ( props ) => {
	const { clientId } = useContext( BlockListBlockContext );
	return <Fill { ...props } name={ getSlotName( clientId ) } />;
};
