/**
 * WordPress dependencies
 */

import {
	SearchControl,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Flex,
	FlexBlock,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { symbol, chevronLeft, chevronRight } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Grid from './grid';
import NoPatterns from './no-patterns';
import usePatterns from './use-patterns';
import SidebarButton from '../sidebar-button';
import useDebouncedInput from '../../utils/use-debounced-input';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function PatternsList( { categoryId, type } ) {
	const location = useLocation();
	const history = useHistory();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ filterValue, setFilterValue, delayedFilterValue ] =
		useDebouncedInput( '' );

	const [ patterns, isResolving ] = usePatterns(
		type,
		categoryId,
		delayedFilterValue
	);

	const { syncedPatterns, unsyncedPatterns } = patterns;
	const hasPatterns = !! syncedPatterns.length || !! unsyncedPatterns.length;

	return (
		<VStack spacing={ 6 }>
			<Flex>
				{ isMobileViewport && (
					<SidebarButton
						icon={ isRTL() ? chevronRight : chevronLeft }
						label={ __( 'Back' ) }
						onClick={ () => {
							// Go back in history if we came from the library page.
							// Otherwise push a stack onto the history.
							if ( location.state?.backPath === '/library' ) {
								history.back();
							} else {
								history.push( { path: '/library' } );
							}
						} }
					/>
				) }
				<FlexBlock>
					<SearchControl
						className="edit-site-library__search"
						onChange={ ( value ) => setFilterValue( value ) }
						placeholder={ __( 'Search patterns' ) }
						label={ __( 'Search patterns' ) }
						value={ filterValue }
						__nextHasNoMarginBottom
					/>
				</FlexBlock>
			</Flex>
			{ isResolving && __( 'Loading' ) }
			{ ! isResolving && !! syncedPatterns.length && (
				<>
					<VStack className="edit-site-library__section-header">
						<Heading level={ 4 }>{ __( 'Synced' ) }</Heading>
						<Text variant="muted" as="p">
							{ __(
								'Patterns that are kept in sync across your site'
							) }
						</Text>
					</VStack>
					<Grid
						icon={ symbol }
						categoryId={ categoryId }
						label={ __( 'Synced patterns' ) }
						items={ syncedPatterns }
					/>
				</>
			) }
			{ ! isResolving && !! unsyncedPatterns.length && (
				<>
					<VStack className="edit-site-library__section-header">
						<Heading level={ 4 }>{ __( 'Standard' ) }</Heading>
						<Text variant="muted" as="p">
							{ __(
								'Patterns that can be changed freely without affecting your site'
							) }
						</Text>
					</VStack>
					<Grid
						categoryId={ categoryId }
						label={ __( 'Standard patterns' ) }
						items={ unsyncedPatterns }
					/>
				</>
			) }
			{ ! isResolving && ! hasPatterns && <NoPatterns /> }
		</VStack>
	);
}
