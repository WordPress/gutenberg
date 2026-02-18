/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
	__experimentalText as Text,
	Navigator,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { isRTL, __, sprintf } from '@wordpress/i18n';
import {
	chevronRight,
	chevronLeft,
	chevronDown,
	check,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { PseudoSelectorDefinition } from './utils';

interface ScreenHeaderProps {
	title: string;
	description?: string | React.ReactElement;
	onBack?: () => void;
	pseudoSelectors?: PseudoSelectorDefinition[];
	selectedPseudoSelector?: string;
	onChangePseudoSelector?: ( value: string ) => void;
}

export function ScreenHeader( {
	title,
	description,
	onBack,
	pseudoSelectors,
	selectedPseudoSelector = 'default',
	onChangePseudoSelector,
}: ScreenHeaderProps ) {
	const hasPseudoSelectors =
		pseudoSelectors && pseudoSelectors.length > 0 && onChangePseudoSelector;

	const stateOptions = hasPseudoSelectors
		? [
				{ label: __( 'Default' ), value: 'default' },
				...pseudoSelectors.map( ( pseudo ) => ( {
					label: pseudo.label,
					value: pseudo.value,
				} ) ),
		  ]
		: [];

	const getCurrentStateLabel = () => {
		const currentOption = stateOptions.find(
			( option ) => option.value === selectedPseudoSelector
		);
		return currentOption?.label || __( 'Default' );
	};

	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<VStack spacing={ 2 }>
						<HStack spacing={ 2 }>
							<Navigator.BackButton
								icon={ isRTL() ? chevronRight : chevronLeft }
								size="small"
								label={ __( 'Back' ) }
								onClick={ onBack }
							/>
							<Spacer>
								<HStack
									justify="space-between"
									alignment="center"
								>
									<Heading
										className="global-styles-ui-header"
										level={ 2 }
										size={ 13 }
									>
										{ title }
									</Heading>
									{ hasPseudoSelectors && (
										<DropdownMenu
											icon={ chevronDown }
											label={ sprintf(
												/* translators: %s: Current state (e.g. "Hover", "Focus") */
												__( 'State: %s' ),
												getCurrentStateLabel()
											) }
											text={ getCurrentStateLabel() }
											toggleProps={ {
												size: 'compact',
												iconPosition: 'right',
											} }
										>
											{ ( { onClose } ) => (
												<MenuGroup
													label={ __( 'State' ) }
												>
													{ stateOptions.map(
														( option ) => (
															<MenuItem
																key={
																	option.value
																}
																onClick={ () => {
																	onChangePseudoSelector(
																		option.value
																	);
																	onClose();
																} }
																icon={
																	selectedPseudoSelector ===
																	option.value
																		? check
																		: null
																}
															>
																{ option.label }
															</MenuItem>
														)
													) }
												</MenuGroup>
											) }
										</DropdownMenu>
									) }
								</HStack>
							</Spacer>
						</HStack>
						{ description && (
							<Text className="global-styles-ui-header__description">
								{ description }
							</Text>
						) }
					</VStack>
				</Spacer>
			</View>
		</VStack>
	);
}
