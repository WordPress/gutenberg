/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	Navigator,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

interface ScreenHeaderProps {
	title: string;
	description?: string | React.ReactElement;
	onBack?: () => void;
}

export function ScreenHeader( {
	title,
	description,
	onBack,
}: ScreenHeaderProps ) {
	return (
		<VStack spacing={ 0 } className="global-styles-ui-screen-header">
			<HStack spacing={ 2 } justify="flex-start">
				<Navigator.BackButton
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="small"
					label={ __( 'Back' ) }
					onClick={ onBack }
				/>
				<Heading
					className="global-styles-ui-header"
					level={ 2 }
					size={ 13 }
				>
					{ title }
				</Heading>
			</HStack>
			{ description && (
				<p className="global-styles-ui-header__description">
					{ description }
				</p>
			) }
		</VStack>
	);
}
