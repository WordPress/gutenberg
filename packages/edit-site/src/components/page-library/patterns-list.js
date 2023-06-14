/**
 * WordPress dependencies
 */

import {
	SearchControl,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { symbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Grid from './grid';
import NoPatterns from './no-patterns';
import usePatterns from './use-patterns';
import useDebouncedInput from '../../utils/use-debounced-input';

export default function PatternsList( { categoryId, label, type } ) {
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
			<SearchControl
				className="edit-site-library__search"
				onChange={ ( value ) => setFilterValue( value ) }
				placeholder={ __( 'Search patterns' ) }
				value={ filterValue }
				__nextHasNoMarginBottom
			/>
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
						label={ label }
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
						label={ label }
						items={ unsyncedPatterns }
					/>
				</>
			) }
			{ ! isResolving && ! hasPatterns && <NoPatterns /> }
		</VStack>
	);
}
