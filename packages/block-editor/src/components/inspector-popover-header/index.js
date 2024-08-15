/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	Button,
	__experimentalText as Text,
} from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

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
						className="block-editor-inspector-popover-header__action"
						label={ __( 'Close' ) }
						icon={ closeSmall }
						onClick={ onClose }
					/>
				) }
			</HStack>
			{ help && <Text>{ help }</Text> }
		</VStack>
	);
}
