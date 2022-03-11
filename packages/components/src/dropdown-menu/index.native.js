/**
 * External dependencies
 */
import classnames from 'classnames';
import { flatMap, isEmpty, isFunction } from 'lodash';
import { Platform } from 'react-native';
/**
 * WordPress dependencies
 */
import { DOWN } from '@wordpress/keycodes';
import { BottomSheet, PanelBody } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { Icon, chevronRight, menu } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import Dropdown from '../dropdown';

function mergeProps( defaultProps = {}, props = {} ) {
	const mergedProps = {
		...defaultProps,
		...props,
	};

	if ( props.className && defaultProps.className ) {
		mergedProps.className = classnames(
			props.className,
			defaultProps.className
		);
	}

	return mergedProps;
}

function DropdownMenu( {
	children,
	className,
	controls,
	icon = menu,
	label,
	popoverProps,
	toggleProps,
	isBottomSheetControl = false,
} ) {
	if ( isEmpty( controls ) && ! isFunction( children ) ) {
		return null;
	}

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets;
	if ( ! isEmpty( controls ) ) {
		controlSets = controls;
		if ( ! Array.isArray( controlSets[ 0 ] ) ) {
			controlSets = [ controlSets ];
		}
	}
	const mergedPopoverProps = mergeProps(
		{
			className: 'components-dropdown-menu__popover',
		},
		popoverProps
	);

	return (
		<Dropdown
			className={ classnames( 'components-dropdown-menu', className ) }
			popoverProps={ mergedPopoverProps }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						onToggle();
					}
				};
				const mergedToggleProps = mergeProps(
					{
						className: classnames(
							'components-dropdown-menu__toggle',
							{
								'is-opened': isOpen,
							}
						),
					},
					toggleProps
				);

				const toolbarButton = () => (
					<Button
						{ ...mergedToggleProps }
						icon={ icon }
						onClick={ ( event ) => {
							onToggle( event );
							if ( mergedToggleProps.onClick ) {
								mergedToggleProps.onClick( event );
							}
						} }
						onKeyDown={ ( event ) => {
							openOnArrowDown( event );
							if ( mergedToggleProps.onKeyDown ) {
								mergedToggleProps.onKeyDown( event );
							}
						} }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
					>
						{ mergedToggleProps.children }
					</Button>
				);

				const bottomSheetControl = () => (
					<BottomSheet.Cell
						onPress={ ( event ) => onToggle( event ) }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						leftAlign
					>
						<Icon icon={ chevronRight }></Icon>
					</BottomSheet.Cell>
				);

				return isBottomSheetControl
					? bottomSheetControl()
					: toolbarButton();
			} }
			renderContent={ ( { isOpen, onClose, ...props } ) => {
				return (
					<BottomSheet
						hideHeader={ true }
						isVisible={ isOpen }
						onClose={ onClose }
					>
						{ isFunction( children ) ? children( props ) : null }
						<PanelBody
							title={ label }
							style={ { paddingLeft: 0, paddingRight: 0 } }
						>
							{ flatMap(
								controlSets,
								( controlSet, indexOfSet ) =>
									controlSet.map(
										( control, indexOfControl ) => (
											<BottomSheet.Cell
												key={ [
													indexOfSet,
													indexOfControl,
												].join() }
												label={ control.title }
												onPress={ () => {
													onClose();
													if ( control.onClick ) {
														control.onClick();
													}
												} }
												editable={ false }
												icon={ control.icon }
												leftAlign={ true }
												isSelected={ control.isActive }
												separatorType={
													Platform.OS === 'android'
														? 'none'
														: 'leftMargin'
												}
											/>
										)
									)
							) }
						</PanelBody>
					</BottomSheet>
				);
			} }
		/>
	);
}

export default withPreferredColorScheme( DropdownMenu );
