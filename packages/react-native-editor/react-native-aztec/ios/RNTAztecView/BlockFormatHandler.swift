
/// Classes conforming this protocol are meant to do formatting work over an specific block.
/// It is useful when we need to force an specific typing format that Aztec is not showing by default.
///
protocol BlockFormatHandler {

    /// Create an instance of a block formatter handler for the given block.
    /// If the given block is not compatible, the init will fail.
    ///
    init?(block: BlockModel)

    /// Set the typing format to an specific one.
    ///
    func forceTypingFormat(on textView: RCTAztecView)
}
