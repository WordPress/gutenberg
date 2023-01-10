/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarItem, DropdownMenu, Slot } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { orderBy } from '../../../utils/sorting';

const POPOVER_PROPS = {
	position: 'bottom right',
	variant: 'toolbar',
};

const FormatToolbar = () => {
	return (
		<>
			{ [ 'bold', 'italic', 'link', 'unknown' ].map( ( format ) => (
				<Slot
					name={ `RichText.ToolbarControls.${ format }` }
					key={ format }
				/>
			) ) }
			<Slot name="RichText.ToolbarControls">
				{ ( fills ) => {
					if ( ! fills.length ) {
						return null;
					}

					const allProps = fills.map( ( [ { props } ] ) => props );
					const hasActive = allProps.some(
						( { isActive } ) => isActive
					);

					return (
						<ToolbarItem>
							{ ( toggleProps ) => (
								<DropdownMenu
									icon={ chevronDown }
									/* translators: button label text should, if possible, be under 16 characters. */
									label={ __( 'More' ) }
									toggleProps={ {
										...toggleProps,
										className: classnames(
											toggleProps.className,
											{ 'is-pressed': hasActive }
										),
										describedBy: __(
											'Displays more block tools'
										),
									} }
									controls={ orderBy(
										fills.map( ( [ { props } ] ) => props ),
										'title'
									) }
									popoverProps={ POPOVER_PROPS }
								/>
							) }
						</ToolbarItem>
					);
				} }
			</Slot>
		</>
	);
};

export default FormatToolbar;
