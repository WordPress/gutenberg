export interface TokenInputProps {
	isExpanded: boolean;
	instanceId: string;
	selectedSuggestionIndex: number;
	onChange: ( { value: string } ) => void;
	value: string;
}
