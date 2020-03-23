/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Animate, Button, Panel, Slot, Fill } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { withPluginContext } from '@wordpress/plugins';
import { starEmpty, starFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ComplementaryAreaHeader from '../complementary-area-header';
import PinnedItems from '../pinned-items';

function ComplementaryAreaSlot( { scope, ...props } ) {
	return <Slot name={ `ComplementaryArea/${ scope }` } { ...props } />;
}

function ComplementaryAreaFill( { scope, children, className } ) {
	return (
		<Fill name={ `ComplementaryArea/${ scope }` }>
			<Animate type="slide-in" options={ { origin: 'left' } }>
				{ () => <div className={ className }>{ children }</div> }
			</Animate>
		</Fill>
	);
}

function ComplementaryArea( {
	className,
	complementaryAreaName,
	toggleShortcut,
	children,
	headerClassName,
	panelClassName,
	icon,
	isPinnable = true,
	title,
	scope,
	header,
	smallScreenTitle,
	closeLabel,
} ) {
	const singleActiveAreaStoreKey = `${ scope }/complementary-area`;
	const pinnedItemsStoreKey = `${ scope }/pinned-items`;
	const { isActive, isPinned } = useSelect(
		( select ) => {
			const { getSingleActiveArea, isMultipleActiveAreaActive } = select(
				'core/interface'
			);
			return {
				isActive:
					getSingleActiveArea( singleActiveAreaStoreKey ) ===
					complementaryAreaName,
				isPinned: isMultipleActiveAreaActive(
					pinnedItemsStoreKey,
					complementaryAreaName
				),
			};
		},
		[ complementaryAreaName, singleActiveAreaStoreKey, pinnedItemsStoreKey ]
	);
	const { setSingleActiveArea } = useDispatch( 'core/interface' );
	const { setMultipleActiveAreaEnableState } = useDispatch(
		'core/interface'
	);
	return (
		<>
			{ isPinned && (
				<PinnedItems scope={ scope }>
					<Button
						icon={ icon }
						label={ title }
						onClick={ () =>
							isActive
								? setSingleActiveArea(
										singleActiveAreaStoreKey
								  )
								: setSingleActiveArea(
										singleActiveAreaStoreKey,
										complementaryAreaName
								  )
						}
						isPressed={ isActive }
						aria-expanded={ isActive }
					/>
				</PinnedItems>
			) }
			{ isActive && (
				<ComplementaryAreaFill
					className={ classnames(
						'interface-complementary-area',
						className
					) }
					scope={ scope }
				>
					<ComplementaryAreaHeader
						className={ headerClassName }
						closeLabel={ closeLabel || __( 'Close plugin' ) }
						onClose={ () =>
							setSingleActiveArea( singleActiveAreaStoreKey )
						}
						smallScreenTitle={ smallScreenTitle }
						toggleShortcut={ toggleShortcut }
					>
						{ header || (
							<>
								<strong>{ title }</strong>
								{ isPinnable && (
									<Button
										icon={
											isPinned ? starFilled : starEmpty
										}
										label={
											isPinned
												? __( 'Unpin from toolbar' )
												: __( 'Pin to toolbar' )
										}
										onClick={ () =>
											setMultipleActiveAreaEnableState(
												pinnedItemsStoreKey,
												complementaryAreaName,
												! isPinned
											)
										}
										isPressed={ isPinned }
										aria-expanded={ isPinned }
									/>
								) }
							</>
						) }
					</ComplementaryAreaHeader>
					<Panel className={ panelClassName }>{ children }</Panel>
				</ComplementaryAreaFill>
			) }
		</>
	);
}

const ComplementaryAreaWrapped = withPluginContext( ( context, ownProps ) => {
	return {
		icon: ownProps.icon || context.icon,
		complementaryAreaName:
			ownProps.complementaryAreaName ||
			`${ context.name }/${ ownProps.name }`,
	};
} )( ComplementaryArea );

ComplementaryAreaWrapped.Slot = ComplementaryAreaSlot;

export default ComplementaryAreaWrapped;
