/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	ToolbarDropdownMenu,
	ToolbarGroup,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import {
	positionCenter,
	positionLeft,
	positionRight,
	stretchFullWidth,
	stretchWide,
} from '@wordpress/icons';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useAvailableAlignments from './use-available-alignments';
/**
 * External dependencies
 */
import classNames from 'classnames';

const BLOCK_ALIGNMENTS_CONTROLS = {
	none: {
		icon: positionCenter,
		title: __( 'None' ),
	},
	left: {
		icon: positionLeft,
		title: __( 'Align left' ),
	},
	center: {
		icon: positionCenter,
		title: __( 'Align center' ),
	},
	right: {
		icon: positionRight,
		title: __( 'Align right' ),
	},
	wide: {
		icon: stretchWide,
		title: __( 'Wide width' ),
	},
	full: {
		icon: stretchFullWidth,
		title: __( 'Full width' ),
	},
};

const DEFAULT_CONTROL = 'none';
const help = __( 'Your theme does not support wide alignments' );

const POPOVER_PROPS = {
	isAlternate: true,
};

function BlockAlignmentUI( {
	value,
	onChange,
	controls,
	isToolbar,
	isCollapsed = true,
} ) {
	const {
		enabledControls,
		layout: { contentSize, wideSize } = {},
		wideAlignmentsSupport,
	} = useAvailableAlignments( controls );
	const hasEnabledControls = !! enabledControls.length;
	const alignmentsInfo = useMemo( () => {
		if ( ! hasEnabledControls ) {
			return;
		}
		const info = {};
		if ( !! contentSize ) {
			// translators: %s: container size (i.e. 600px etc)
			info.none = sprintf( __( 'Max %s wide' ), contentSize );
		}
		if ( wideAlignmentsSupport && !! wideSize ) {
			// translators: %s: container size (i.e. 600px etc)
			info.wide = sprintf( __( 'Max %s wide' ), wideSize );
		}
		return info;
	}, [ hasEnabledControls, contentSize, wideSize, wideAlignmentsSupport ] );

	if ( ! hasEnabledControls ) {
		return null;
	}
	// Always add the `none` option.
	enabledControls.unshift( 'none' );

	function applyOrUnset( align ) {
		return () =>
			onChange( [ value, 'none' ].includes( align ) ? undefined : align );
	}

	const activeAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	const UIComponent = isToolbar ? ToolbarGroup : ToolbarDropdownMenu;
	const commonProps = {
		popoverProps: POPOVER_PROPS,
		icon: activeAlignmentControl
			? activeAlignmentControl.icon
			: defaultAlignmentControl.icon,
		label: __( 'Align' ),
		toggleProps: { describedBy: __( 'Change alignment' ) },
	};
	const extraProps = isToolbar
		? {
				isCollapsed,
				controls: enabledControls.map( ( control ) => {
					return {
						...BLOCK_ALIGNMENTS_CONTROLS[ control ],
						isActive: value === control,
						role: isCollapsed ? 'menuitemradio' : undefined,
						onClick: applyOrUnset( control ),
					};
				} ),
		  }
		: {
				children: () => {
					return (
						<>
							<MenuGroup className="block-editor-block-alignment-control__menu-group">
								{ enabledControls.map( ( control ) => {
									const {
										icon,
										title,
									} = BLOCK_ALIGNMENTS_CONTROLS[ control ];
									// check when `undefined` to select `none`..
									const isSelected =
										control === value ||
										( ! value && control === 'none' );

									return (
										<MenuItem
											key={ control }
											icon={ icon }
											iconPosition="left"
											className={ classNames(
												'components-dropdown-menu__menu-item',
												{
													'is-active': isSelected,
												}
											) }
											isSelected={ isSelected }
											onClick={ applyOrUnset( control ) }
											role="menuitemradio"
											info={ alignmentsInfo[ control ] }
										>
											{ title }
										</MenuItem>
									);
								} ) }
							</MenuGroup>
							{ ! wideAlignmentsSupport && <div>{ help }</div> }
						</>
					);
				},
		  };

	return <UIComponent { ...commonProps } { ...extraProps } />;
}

export default BlockAlignmentUI;
