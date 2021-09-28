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
import { useSelect } from '@wordpress/data';
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
import ListViewBlockSelectButton from './block-select-button';
import { getBlockPositionDescription } from './utils';
import { store as blockEditorStore } from '../../store';
import ListViewExpander from './expander';

const getSlotName = ( clientId ) => `ListViewBlock-${ clientId }`;

function ListViewBlockSlot( props, ref ) {
	const { clientId } = props.block;
	const { name } = useSelect(
		( select ) => select( blockEditorStore ).getBlockName( clientId ),
		[ clientId ]
	);
	const instanceId = useInstanceId( ListViewBlockSlot );

	return (
		<Slot name={ getSlotName( clientId ) }>
			{ ( fills ) => {
				if ( ! fills.length ) {
					return (
						<ListViewBlockSelectButton ref={ ref } { ...props } />
					);
				}

				const {
					className,
					isSelected,
					position,
					siblingBlockCount,
					level,
					tabIndex,
					onFocus,
					onToggleExpanded,
				} = props;

				const blockType = getBlockType( name );
				const descriptionId = `list-view-block-slot__${ instanceId }`;
				const blockPositionDescription = getBlockPositionDescription(
					position,
					siblingBlockCount,
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
								'block-editor-list-view-block-slot',
								className
							) }
						>
							<ListViewExpander onClick={ onToggleExpanded } />
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
								className="block-editor-list-view-block-slot__description"
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
}

export default forwardRef( ListViewBlockSlot );

export const ListViewBlockFill = ( props ) => {
	const { clientId } = useContext( BlockListBlockContext );
	return <Fill { ...props } name={ getSlotName( clientId ) } />;
};
