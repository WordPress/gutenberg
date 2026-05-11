/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
	__experimentalText as WCText,
	Navigator,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { StateDefinition } from './utils';
import { unlock } from './lock-unlock';

const { StateControl, StateControlBadges } = unlock( blockEditorPrivateApis );

interface ActiveState {
	key: string;
	label: string;
}

interface ScreenHeaderProps {
	title: string;
	description?: string | React.ReactElement;
	onBack?: () => void;
	viewportStates?: StateDefinition[];
	pseudoStates?: StateDefinition[];
	selectedViewport?: string;
	selectedPseudoState?: string;
	onChangeViewport?: ( value: string ) => void;
	onChangePseudoState?: ( value: string ) => void;
}

export function ScreenHeader( {
	title,
	description,
	onBack,
	viewportStates,
	pseudoStates,
	selectedViewport = 'default',
	selectedPseudoState = 'default',
	onChangeViewport,
	onChangePseudoState,
}: ScreenHeaderProps ) {
	const activeStates: ActiveState[] = [];
	const activeViewport = viewportStates?.find(
		( state ) => state.value === selectedViewport
	);
	const activePseudoState = pseudoStates?.find(
		( state ) => state.value === selectedPseudoState
	);

	if ( activeViewport ) {
		activeStates.push( {
			key: `viewport-${ activeViewport.value }`,
			label: activeViewport.label,
		} );
	}

	if ( activePseudoState ) {
		activeStates.push( {
			key: `pseudo-${ activePseudoState.value }`,
			label: activePseudoState.label,
		} );
	}

	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<VStack spacing={ 2 }>
						<HStack spacing={ 2 } alignment="top">
							<Navigator.BackButton
								icon={ isRTL() ? chevronRight : chevronLeft }
								size="small"
								label={ __( 'Back' ) }
								onClick={ onBack }
							/>
							<Spacer>
								<HStack justify="space-between" alignment="top">
									<Heading
										className="global-styles-ui-header"
										level={ 2 }
										size={ 13 }
									>
										{ title }
									</Heading>
									<VStack spacing={ 2 } alignment="right">
										<StateControl
											viewportStates={ viewportStates }
											pseudoStates={ pseudoStates }
											viewportValue={ selectedViewport }
											pseudoStateValue={
												selectedPseudoState
											}
											onChangeViewport={
												onChangeViewport
											}
											onChangePseudoState={
												onChangePseudoState
											}
										/>
										<StateControlBadges
											states={ activeStates }
										/>
									</VStack>
								</HStack>
							</Spacer>
						</HStack>
						{ description && (
							<WCText className="global-styles-ui-header__description">
								{ description }
							</WCText>
						) }
					</VStack>
				</Spacer>
			</View>
		</VStack>
	);
}
