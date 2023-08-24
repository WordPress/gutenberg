/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import usePatternCategories from '../sidebar-navigation-screen-patterns/use-pattern-categories';
import { TEMPLATE_PARTS, PATTERNS } from './utils';

export default function PatternsHeader( {
	categoryId,
	type,
	titleId,
	descriptionId,
} ) {
	const { patternCategories } = usePatternCategories();
	const templatePartAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);

	let title, description;
	if ( type === TEMPLATE_PARTS ) {
		const templatePartArea = templatePartAreas.find(
			( area ) => area.area === categoryId
		);
		title = templatePartArea?.label;
		description = templatePartArea?.description;
	} else if ( type === PATTERNS ) {
		const patternCategory = patternCategories.find(
			( category ) => category.name === categoryId
		);
		title = patternCategory?.label;
		description = patternCategory?.description;
	}

	if ( ! title ) return null;

	return (
		<VStack className="edit-site-patterns__section-header">
			<Heading as="h2" level={ 4 } id={ titleId }>
				{ title }
			</Heading>
			{ description ? (
				<Text variant="muted" as="p" id={ descriptionId }>
					{ description }
				</Text>
			) : null }
		</VStack>
	);
}
