import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Button,
} from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import type { InspectorPopoverHeaderProps } from './types';

export default function InspectorPopoverHeader( {
	title,
	help,
	actions = [],
	onClose,
}: InspectorPopoverHeaderProps ) {
	return (
		<VStack className="block-editor-inspector-popover-header" spacing={ 4 }>
			<HStack alignment="center">
				<Text
					variant="heading-md"
					render={ <h2 /> }
					className="block-editor-inspector-popover-header__heading"
				>
					{ title }
				</Text>
				<Spacer />
				{ actions.map( ( { label, icon, onClick } ) => (
					<Button
						size="small"
						key={ label }
						className="block-editor-inspector-popover-header__action"
						label={ label }
						icon={ icon }
						// `false` keeps the default variant.
						variant={
							( ! icon && 'tertiary' ) as 'tertiary' | undefined
						}
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
			{ help && <Text>{ help }</Text> }
		</VStack>
	);
}
