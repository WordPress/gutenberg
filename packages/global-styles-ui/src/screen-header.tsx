import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
	__experimentalText as WCText,
	Button,
	Navigator,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { StateDefinition } from './utils';
import { unlock } from './lock-unlock';

const { StateControl, StateControlBadges } = unlock( blockEditorPrivateApis );

interface ScreenHeaderProps {
	title: string;
	description?: string | React.ReactElement;
	/**
	 * Replaces the back button's default navigation. Without it the button
	 * moves up one path segment, which is wrong for a screen whose path
	 * carries a selection (for example `/revisions/12`) rather than a
	 * sub-screen.
	 */
	onBack?: () => void;
	viewportStates?: StateDefinition[];
	pseudoStates?: StateDefinition[];
	selectedViewport?: string;
	selectedPseudoState?: string;
	onChangeViewport?: ( value: string ) => void;
	onChangePseudoState?: ( value: string ) => void;
	showResponsiveStateControls?: boolean;
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
	showResponsiveStateControls = true,
}: ScreenHeaderProps ) {
	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<VStack spacing={ 2 }>
						<HStack spacing={ 2 } alignment="top">
							{ onBack ? (
								<Button
									icon={
										isRTL() ? chevronRight : chevronLeft
									}
									size="small"
									label={ __( 'Back' ) }
									onClick={ onBack }
								/>
							) : (
								<Navigator.BackButton
									icon={
										isRTL() ? chevronRight : chevronLeft
									}
									size="small"
									label={ __( 'Back' ) }
								/>
							) }
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
											viewportStates={
												showResponsiveStateControls
													? viewportStates
													: []
											}
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
											viewportStates={ viewportStates }
											pseudoStates={ pseudoStates }
											viewportValue={ selectedViewport }
											pseudoStateValue={
												selectedPseudoState
											}
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
