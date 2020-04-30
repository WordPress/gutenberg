/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PatternsList from '../patterns-list';
import InserterPanel from './panel';
import useInserterPatterns from './use-inserter-patterns';

function PatternsTab( { onInsert } ) {
	const [ patterns, onSelect ] = useInserterPatterns( {
		onInsert,
	} );

	return (
		<InserterPanel title={ _x( 'All', 'patterns' ) }>
			<PatternsList patterns={ patterns } onSelect={ onSelect } />
		</InserterPanel>
	);
}

export default PatternsTab;
