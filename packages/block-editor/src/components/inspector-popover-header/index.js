import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	Button,
	__experimentalText as WCText,
} from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/*
 * InspectorPopoverHeader Component
 *
 * Renders a header that is suitable for use in an
 * inspector sidebar popover.
 *
 * @param {Object} props             The component props.
 * @param {string} props.title       Title to display in the header.
 * @param {string} [props.help]      Optional. Text to display at the bottom of the header.
 * @param {Array}  [props.actions]   Optional. Array of actions to display in the header as a row of buttons.
 * @param {Function} [props.onClose] Optional. Function called when the user presses the close button. If not provided, no close button will appear.
 * @return {JSX.Element}             A styled header component for an inspector sidebar popover.
 */
export default function InspectorPopoverHeader( {
	title,
	help,
	actions = [],
	onClose,
} ) {
	return (
		<VStack className="block-editor-inspector-popover-header" spacing={ 4 }>
			<HStack alignment="center">
				<Heading
					className="block-editor-inspector-popover-header__heading"
					level={ 2 }
					size={ 13 }
				>
					{ title }
				</Heading>
				<Spacer />
				{ actions.map( ( { label, icon, onClick } ) => (
					<Button
						size="small"
						key={ label }
						className="block-editor-inspector-popover-header__action"
						label={ label }
						icon={ icon }
						variant={ ! icon && 'tertiary' }
						onClick={ onClick }
					>
						{ ! icon && label }
					</Button>
				) ) }
				{ onClose && (
					<Button
						size="small"
						className="block-editor-inspector-popover-header__action"
						label={ __( 'Close' ) }
						icon={ closeSmall }
						onClick={ onClose }
					/>
				) }
			</HStack>
			{ help && <WCText>{ help }</WCText> }
		</VStack>
	);
}
