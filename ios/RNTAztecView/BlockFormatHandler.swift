protocol BlockFormatHandler {

    /// Create an instance of a block formatter handler for the given block.
    /// If the given block is not compatible, the init will fail.
    ///
    init?(block: BlockModel)

    /// Set the typing format to an specific one.
    ///
    func forceTypingFormat(on textView: RCTAztecView)
}
