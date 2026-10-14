export interface DraggingProps {
	onDragStart?: ( e: React.MouseEvent ) => void;
	onDragMove?: ( e: MouseEvent ) => void;
	onDragEnd?: ( e?: MouseEvent ) => void;
}

export interface DraggingReturn {
	startDrag: ( e: React.MouseEvent ) => void;
	endDrag: ( e?: MouseEvent ) => void;
	isDragging: boolean;
}
