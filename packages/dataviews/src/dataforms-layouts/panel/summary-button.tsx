/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

function SummaryButton< Item >( {
	summaryFields,
	data,
}: {
	summaryFields: NormalizedField< Item >[];
	data: Item;
} ) {
	return summaryFields.length > 1 ? (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				width: '100%',
				gap: '2px',
			} }
		>
			{ summaryFields.map( ( summaryField ) => (
				<div key={ summaryField.id } style={ { width: '100%' } }>
					<summaryField.render item={ data } field={ summaryField } />
				</div>
			) ) }
		</div>
	) : (
		summaryFields.map( ( summaryField ) => (
			<summaryField.render
				key={ summaryField.id }
				item={ data }
				field={ summaryField }
			/>
		) )
	);
}

export default SummaryButton;
