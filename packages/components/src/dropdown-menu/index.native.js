/**
 * External dependencies
 */
import classnames from 'classnames';
import { Platform } from 'react-native';
/**
 * WordPress dependencies
 */
import { BottomSheet, BottomSheetV2, PanelBody } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { menu } from '@wordpress/icons';

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

/**
 * Whether the argument is a function.
 *
 * @param {*} maybeFunc The argument to check.
 * @return {boolean} True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc ) {
	return typeof maybeFunc === 'function';
}

function DropdownMenu( {
	children,
	className,
	controls,
	icon = menu,
	label,
	popoverProps,
	toggleProps,
} ) {
	if ( ! controls?.length && ! isFunction( children ) ) {
		return null;
	}

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets;
	if ( controls?.length ) {
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

				return (
					<Button
						{ ...mergedToggleProps }
						icon={ icon }
						onClick={ ( event ) => {
							onToggle( event );
							if ( mergedToggleProps.onClick ) {
								mergedToggleProps.onClick( event );
							}
						} }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
					>
						{ mergedToggleProps.children }
					</Button>
				);
			} }
			renderContent={ ( { isOpen, onClose, ...props } ) => {
				return (
					<BottomSheetV2
						index={ isOpen ? 0 : -1 }
						onClose={ onClose }
						snapPoints={ [ BottomSheetV2.CONTENT_HEIGHT ] }
						style={ {
							paddingLeft: 16,
							paddingRight: 16,
						} }
					>
						{ isFunction( children ) ? children( props ) : null }
						<PanelBody
							title={ label }
							style={ { paddingLeft: 0, paddingRight: 0 } }
						>
							{ controlSets?.flatMap(
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
					</BottomSheetV2>
				);
			} }
		/>
	);
}

export default withPreferredColorScheme( DropdownMenu );
