export const getHandlersData = ( {
	multilineTag,
	formatTypes,
	onSelectionChange,
	setActiveFormats,
	record,
	currentRecord = record.current,
	placeholder,
	handleChange,
	onDelete,
	recordData,
	activeFormats,
} ) => ( {
	handlerEnterData: {
		formatTypes,
		recordData,
		handleChange,
	},
	handleDeleteData: {
		recordData,
		handleChange,
		onDelete,
		activeFormats,
		multilineTag,
	},
	handleHorizontalNavigationData: {
		placeholder,
		currentRecord,
		onSelectionChange,
		setActiveFormats,
	},
} );
