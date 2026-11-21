/**
 * Props of the patterns pagination.
 */
export interface PaginationProps {
	currentPage: number;
	numPages: number;
	changePage: ( page: number ) => void;
	totalItems: number;
}
