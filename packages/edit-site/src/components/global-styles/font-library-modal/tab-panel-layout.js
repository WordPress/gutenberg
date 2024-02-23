/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHStack as HStack,
	Button,
	Notice,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';

function TabPanelLayout( {
	title,
	description,
	notice,
	handleBack,
	children,
	footer,
	actions,
} ) {
	const { setNotice } = useContext( FontLibraryContext );

	return (
		<div className="font-library-modal__tabpanel-layout">
			<Spacer margin={ 4 } />
			<VStack spacing={ 4 } justify="space-between">
				<VStack spacing={ 2 }>
					<HStack
						justify={
							!! handleBack ? 'flex-start' : 'space-between'
						}
					>
						{ !! handleBack && (
							<Button
								variant="tertiary"
								onClick={ handleBack }
								icon={ chevronLeft }
								size="small"
								label={ __( 'Back' ) }
							/>
						) }
						{ title && (
							<Heading
								level={ 2 }
								size={ 13 }
								className="edit-site-global-styles-header"
							>
								{ title }
							</Heading>
						) }
						{ actions && <FlexItem>{ actions }</FlexItem> }
					</HStack>
					{ description && <Text>{ description }</Text> }
					{ notice && (
						<FlexBlock>
							<Spacer margin={ 1 } />
							<Notice
								status={ notice.type }
								onRemove={ () => setNotice( null ) }
							>
								{ notice.message }
							</Notice>
							<Spacer margin={ 1 } />
						</FlexBlock>
					) }
				</VStack>
				<div className="font-library-modal__tabpanel-layout__main">
					{ children }
				</div>
				{ footer && (
					<div className="font-library-modal__tabpanel-layout__footer">
						{ footer }
					</div>
				) }
			</VStack>
		</div>
	);
}

export default TabPanelLayout;
