declare function Vips(config?: Partial<EmscriptenModule>): Promise<NonNullable<typeof Vips>>;

type ModuleCallback = { (module?: any): void };

interface EmscriptenModule {
    print(str: string): void;
    printErr(str: string): void;

    dynamicLibraries: string[];

    preInit: ModuleCallback | ModuleCallback[];
    preRun: ModuleCallback | ModuleCallback[];
    postRun: ModuleCallback | ModuleCallback[];

    onAbort: { (what: any): void };
    onRuntimeInitialized: { (): void };

    instantiateWasm(
        imports: WebAssembly.Imports,
        successCallback: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void
    ): WebAssembly.Exports;
    locateFile(url: string, scriptDirectory: string): string;
    mainScriptUrlOrBlob: Blob | File | string;

    // https://github.com/kleisauke/wasm-vips/issues/12
    workaroundCors: boolean;
}

declare module Vips {
    // Allow single pixels/images as input.
    type SingleOrArray<T> = T | T[];

    type Enum = string | number;
    type Flag = string | number;
    type Blob = string | ArrayBuffer | Uint8Array | Uint8ClampedArray | Int8Array;
    type Memory =
        Int8Array
        | Uint8Array
        | Int16Array
        | Uint16Array
        | Int32Array
        | Uint32Array
        | Float32Array
        | Float64Array;
    type ArrayConstant = SingleOrArray<number>;
    type ArrayImage = SingleOrArray<Image> | Vector<Image>;
    type DeletionFuncs<T extends EmbindClassHandle<T>> = EmbindClassHandle<T>[];

    //#region Utility functions

    /**
     * Queue of handles to be deleted.
     * This is filled when {@link deleteLater} is called on the handle.
     */
    const deletionQueue: DeletionFuncs<Image | Connection | Interpolate>;

    /**
     * Get the major, minor or patch version number of the libvips library.
     * When the flag is omitted, the entire version number is returned as a string.
     * @param flag 0 to get the major version number, 1 to get minor, 2 to get patch.
     * @return The version number of libvips.
     */
    function version(flag?: number): string | number;

    /**
     * Returns a string identifying the Emscripten version used for compiling wasm-vips.
     * @return The version number of Emscripten.
     */
    function emscriptenVersion(): string;

    /**
     * Get detailed information about the installation of libvips.
     * @return Information about how libvips is configured.
     */
    function config(): string;

    /**
     * Gets or, when a parameter is provided, sets the number of worker threads libvips' should create to
     * process each image.
     * @param concurrency The number of worker threads.
     * @return The number of worker threads libvips uses for image evaluation.
     */
    function concurrency(concurrency?: number): void | number;

    /**
     * Set the block state on all untrusted operations.
     * For example:
     * ```js
     * vips.blockUntrusted(true);
     * ```
     * Will block all untrusted operations from running. Use:
     * ```bash
     * $ vips -l | grep untrusted
     * ```
     * at the command-line to see which operations are marked as untrusted.
     * @param state Set to `true` to block the operations, set to `false` to re-enable them.
     */
    function blockUntrusted(state: boolean): void;

    /**
     * Set the block state on all operations in the libvips class hierarchy.
     * For example:
     * ```js
     * vips.operationBlock('VipsForeignLoad', true);
     * vips.operationBlock('VipsForeignLoadJpeg', false);
     * ```
     * Will block all load operations, except JPEG. Use:
     * ```bash
     * $ vips -l
     * ```
     * at the command-line to see the class hierarchy.
     * @param name The name of the operation in the libvips class hierarchy.
     * @param state Set to `true` to block the operation, set to `false` to re-enable it.
     */
    function operationBlock(name: string, state: boolean): void;

    /**
     * Call this to drop caches, close plugins, terminate background threads, and finalize any internal library testing.
     * Calling this is optional. If you don't call it, your platform will clean up for you.
     * The only negative consequences are that the leak checker and the profiler will not work.
     */
    function shutdown(): void;

    //#endregion

    //#region APIs

    /**
     * Embind adds the following methods to all its exposed classes.
     */
    abstract class EmbindClassHandle<T extends EmbindClassHandle<T>> {
        /**
         * Returns a new handle. It must eventually also be disposed with {@link [Symbol.dispose]} or
         * {@link deleteLater}.
         * @return A new handle.
         */
        clone(): T;

        /**
         * Support for `using ...`.
         * See also: https://github.com/tc39/proposal-explicit-resource-management
         */
        // @ts-ignore - If targeting lower than ESNext, this symbol might not exist.
        [Symbol.dispose](): void;

        /**
         * Signal that a C++ object is no longer needed and can be deleted.
         * Alias for {@link [Symbol.dispose]}.
         */
        delete(): void;

        /**
         * Signal that a C++ object is no longer needed and can be deleted later.
         * @return `this`.
         */
        deleteLater(): T;

        /**
         * Check whether two Embind handles point to the same underlying object.
         * @param other Embind handle for comparison.
         * @return `true` if the handles point to the same underlying object.
         */
        isAliasOf(other: any): boolean;

        /**
         * Check whether this handle is deleted.
         * @return `true` if this handle is deleted.
         */
        isDeleted(): boolean;

        /**
         * Prevents the C++ object from being auto deleted.
         * @return `this`.
         */
        preventAutoDelete(): T;
    }

    /**
     * A sequence container representing an array that can change in size.
     */
    interface Vector<T> extends EmbindClassHandle<Vector<T>>, Iterable<T> {
        /**
         * Adds a new element at the end of the vector, after its current last element.
         * @param val The value to be appended at the end of the container.
         */
        push_back(val: T): void;

        /**
         * Resizes the container so that it contains n elements.
         * @param n New size of the container.
         * @param val The value to initialize the new elements with.
         */
        resize(n: number, val: T): void;

        /**
         * Returns the number of elements in the container.
         * @return The number of elements in the container.
         */
        size(): number;

        /**
         * Access a specified element with bounds checking.
         * @param pos Position of the element to return.
         * @return The requested element or `undefined`.
         */
        get(pos: number): T | undefined;

        /**
         * Update a specified element at a certain position.
         * @param pos Position of the element to update.
         * @param val Value to be stored at the specified position.
         * @return `true` if successfully updated.
         */
        set(pos: number, val: T): boolean;
    }

    /**
     * An abstract class around libvips' operation cache.
     */
    abstract class Cache {
        /**
         * Gets or, when a parameter is provided, sets the maximum number of operations libvips keeps in cache.
         * @param max Maximum number of operations.
         * @return The maximum number of operations libvips keeps in cache.
         */
        static max(max?: number): void | number;

        /**
         * Gets or, when a parameter is provided, sets the maximum amount of tracked memory allowed.
         * @param mem Maximum amount of tracked memory.
         * @return The maximum amount of tracked memory libvips allows.
         */
        static maxMem(mem?: number): void | number;

        /**
         * Gets or, when a parameter is provided, sets the maximum amount of tracked files allowed.
         * @param maxFiles Maximum amount of tracked files.
         * @return The maximum amount of tracked files libvips allows.
         */
        static maxFiles(maxFiles?: number): void | number;

        /**
         * Get the current number of operations in cache.
         * @return The current number of operations in cache.
         */
        static size(): number;
    }

    /**
     * An abstract class that provides the statistics of memory usage and opened files.
     * libvips watches the total amount of live tracked memory and
     * uses this information to decide when to trim caches.
     */
    abstract class Stats {
        /**
         * Get the number of active allocations.
         * @return The number of active allocations.
         */
        static allocations(): number;

        /**
         * Get the number of bytes currently allocated `vips_malloc()` and friends.
         * libvips uses this figure to decide when to start dropping cache.
         * @return The number of bytes currently allocated.
         */
        static mem(): number;

        /**
         * Get the largest number of bytes simultaneously allocated via `vips_tracked_malloc()`.
         * Handy for estimating max memory requirements for a program.
         * @return The largest number of currently allocated bytes.
         */
        static memHighwater(): number;

        /**
         * Get the number of open files.
         * @return The number of open files.
         */
        static files(): number;
    }

    /**
     * Handy utilities.
     */
    abstract class Utils {
        /**
         * Return the GType for a name.
         * @param name Type name to lookup.
         * @return Corresponding type ID, or `0` if not found.
         */
        static typeFromName(name: string): number;

        /**
         * Get the GType for a name.
         * Looks up the GType for a nickname. Types below basename in the type hierarchy are searched.
         * @param basename Name of base class.
         * @param nickname Search for a class with this nickname.
         * @return The GType of the class, or `0` if the class is not found.
         */
        static typeFind(basename: string, nickname: string): number;

        /**
         * Make a temporary file name. The format parameter is something like `"%s.jpg"`
         * and will be expanded to something like `"/tmp/vips-12-34587.jpg"`.
         * @param format The filename format.
         */
        static tempName(format: string): string;
    }

    /**
     * The abstract base Connection class.
     */
    abstract class Connection extends EmbindClassHandle<Connection> {
        /**
         * The filename associated with a connection, if any.
         */
        readonly filename?: string;

        /**
         * Make a human-readable name for a connection suitable for error messages.
         */
        readonly nick: string;
    }

    /**
     * An input connection.
     */
    class Source extends Connection {
        /**
         * Make a new source from a file.
         *
         * Make a new source that is attached to the named file. For example:
         * ```js
         * const source = vips.Source.newFromFile('myfile.jpg');
         * ```
         * You can pass this source to (for example) {@link Image.newFromSource}.
         * @param filename The file.
         * @return A new source.
         */
        static newFromFile(filename: string): Source;

        /**
         * Make a new source from a memory object.
         *
         * Make a new source that is attached to the memory object. For example:
         * ```js
         * const data = image.writeToBuffer('.jpg');
         * const source = vips.Source.newFromMemory(data);
         * ```
         * You can pass this source to (for example) {@link Image.newFromSource}.
         * @param memory The memory object.
         * @return A new source.
         */
        static newFromMemory(memory: Blob): Source;
    }

    /**
     * A source that can be attached to callbacks to implement behavior.
     */
    class SourceCustom extends Source {
        /**
         * Attach a read handler.
         * The handler is given a number of bytes to fetch {@link length}, and should return a
         * bytes-like object containing up to that number of bytes. If there's no more data
         * available, it should return `undefined`.
         * @param length The maximum number of bytes to be read.
         * @return A blob up to {@link length} bytes or `undefined` if there's no more data available.
         */
        onRead: (length: number) => Blob | undefined;

        /**
         * Attach a seek handler.
         * Seek handlers are optional. If you do not set one, your source will be
         * treated as unseekable and libvips will do extra caching.
         * @param offset A byte offset relative to the whence parameter.
         * @param size A value indicating the reference point used to obtain the new position.
         * @return The new position within the current source.
         */
        onSeek: (offset: number, whence: number) => number;
    }

    /**
     * An output connection.
     */
    class Target extends Connection {
        /**
         * Make a new target to write to a file.
         *
         * Make a new target that will write to the named file. For example:
         * ```js
         * const target = vips.Target.newToFile('myfile.jpg');
         * ```
         * You can pass this target to (for example) {@link image.writeToTarget}.
         * @param filename Write to this file.
         * @return A new target.
         */
        static newToFile(filename: string): Target;

        /**
         * Make a new target to write to an area of memory.
         *
         * Make a new target that will write to memory. For example:
         * ```js
         * const target = vips.Target.newToMemory();
         * ```
         * You can pass this target to (for example) {@link image.writeToTarget}.
         *
         * After writing to the target, fetch the bytes from the target object with {@link getBlob}.
         * @return A new target.
         */
        static newToMemory(): Target;

        /**
         * Fetch the typed array of 8-bit unsigned integer values
         * from the target object.
         *
         * @return A typed array of 8-bit unsigned integer values.
         */
        getBlob(): Uint8Array;
    }

    /**
     * A target that can be attached to callbacks to implement behavior.
     */
    class TargetCustom extends Target {
        /**
         * Attach a write handler.
         * @param data A typed array of 8-bit unsigned integer values.
         * @return The number of bytes that were written.
         */
        onWrite: (data: Uint8Array) => number;

        /* libtiff needs to be able to seek and read on targets, unfortunately.
         */

        /**
         * Attach a read handler.
         * @param length The maximum number of bytes to be read.
         * @return A blob up to {@link length} bytes or `undefined` if there's no more data available.
         */
        onRead: (length: number) => Blob | undefined;

        /**
         * Attach a seek handler.
         * @param offset A byte offset relative to the whence parameter.
         * @param size A value indicating the reference point used to obtain the new position.
         * @return The new position within the current target.
         */
        onSeek: (offset: number, whence: number) => number;

        /**
         * Attach an end handler.
         * This optional handler is called at the end of write. It should do any
         * cleaning up, if necessary.
         * @return 0 on success, -1 on error.
         */
        onEnd: () => number;
    }

    /**
     * A class to build various interpolators.
     * For e.g. nearest, bilinear, and some non-linear.
     */
    class Interpolate extends EmbindClassHandle<Interpolate> {
        /**
         * Look up an interpolator from a nickname and make one.
         * @param nickname Nickname for interpolator.
         * @return An interpolator.
         */
        static newFromName(nickname: string): Interpolate;
    }

    /**
     * An image class.
     */
    class Image extends ImageAutoGen {
        /**
         * Image width in pixels.
         */
        readonly width: number;

        /**
         * Image height in pixels.
         */
        readonly height: number;

        /**
         * Number of bands in image.
         */
        readonly bands: number;

        /**
         * Pixel format in image.
         */
        readonly format: string;

        /**
         * Pixel coding.
         */
        readonly coding: string;

        /**
         * Pixel interpretation.
         */
        readonly interpretation: string;

        /**
         * Horizontal offset of origin.
         */
        readonly xoffset: number;

        /**
         * Vertical offset of origin.
         */
        readonly yoffset: number;

        /**
         * Horizontal resolution in pixels/mm.
         */
        readonly xres: number;

        /**
         * Vertical resolution in pixels/mm.
         */
        readonly yres: number;

        /**
         * Image filename, if any.
         */
        readonly filename?: string;

        /**
         * The associated gainmap image, if any.
         */
        readonly gainmap?: Image;

        /**
         * Page height in pixels.
         */
        readonly pageHeight: number;

        /**
         * Block evaluation on this image.
         */
        kill: boolean;

        /**
         * Attach progress feedback.
         *
         * This method can update user-interfaces with progress feedback,
         * for example:
         * ```js
         * const image = vips.Image.newFromFile('huge.jpg');
         * image.onProgress = (percent) =>
         *   console.log(`${percent}% complete`);
         * image.writeToFile('x.png');
         * ```
         * @param percent Percent complete.
         */
        onProgress: (percent: number) => void;

        //#region Constructor functions

        /**
         * Creates a new image which, when written to, will create a memory image.
         * @return A new image.
         */
        static newMemory(): Image;

        /**
         * Make a new temporary image.
         *
         * Returns an image backed by a temporary file. When written to with
         * {@link write}, a temporary file will be created on disc in the
         * specified format. When the image is closed, the file will be deleted
         * automatically.
         *
         * The file is created in the temporary directory. This is set with
         * the environment variable `TMPDIR`. If this is not set, vips will
         * default to `/tmp`.
         *
         * libvips uses `g_mkstemp()` to make the temporary filename. They
         * generally look something like `"vips-12-EJKJFGH.v"`.
         * @param format The format for the temp file, defaults to a vips
         * format file (`"%s.v"`). The `%s` is substituted by the file path.
         * @return A new image.
         */
        static newTempFile(format?: string): Image;

        /**
         * Load an image from a file.
         *
         * This method can load images in any format supported by libvips. The
         * filename can include load options, for example:
         * ```js
         * const image = vips.Image.newFromFile('fred.jpg[shrink=2]');
         * ```
         * You can also supply options as keyword arguments, for example:
         * ```js
         * const image = vips.Image.newFromFile('fred.jpg', {
         *     shrink: 2
         * });
         * ```
         * The full set of options available depend upon the load operation that
         * will be executed. Try something like:
         * ```bash
         * $ vips jpegload
         * ```
         * at the command-line to see a summary of the available options for the
         * JPEG loader.
         *
         * Loading is fast: only enough of the image is loaded to be able to fill
         * out the header. Pixels will only be decompressed when they are needed.
         * @param vipsFilename The file to load the image from, with optional appended arguments.
         * @param options Optional options that depend on the load operation.
         * @return A new image.
         */
        static newFromFile(vipsFilename: string, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Hint the expected access pattern for the image.
             */
            access?: Access | Enum
            /**
             * The type of error that will cause load to fail. By default,
             * loaders are permissive, that is, {@link FailOn.none}.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
        }): Image;

        /**
         * Wrap an image around a memory array.
         *
         * Wraps an Image around an area of memory containing a C-style array. For
         * example, if the `data` memory array contains four bytes with the
         * values 1, 2, 3, 4, you can make a one-band, 2x2 uchar image from
         * it like this:
         * ```js
         * const data = new Uint8Array([1, 2, 3, 4]);
         * const image = vips.Image.newFromMemory(data, 2, 2, 1, vips.BandFormat.uchar);
         * ```
         * The data object will internally be copied from JavaScript to WASM.
         *
         * This method is useful for efficiently transferring images from WebGL into
         * libvips.
         *
         * See {@link writeToMemory} for the opposite operation.
         * Use {@link copy} to set other image attributes.
         * @param data A C-style JavaScript array.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param bands Number of bands.
         * @param format Band format.
         * @return A new image.
         */
        static newFromMemory(data: Memory, width: number, height: number, bands: number, format: BandFormat): Image;

        /**
         * Wrap an image around a pointer.
         *
         * This behaves exactly as {@link newFromMemory}, but the image is
         * loaded from a pointer rather than from a JavaScript array.
         * @param ptr A memory address.
         * @param size Length of memory area.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param bands Number of bands.
         * @param format Band format.
         * @return A new image.
         */
        static newFromMemory(ptr: number, size: number, width: number, height: number, bands: number, format: BandFormat): Image;

        /**
         * Load a formatted image from memory.
         *
         * This behaves exactly as {@link newFromFile}, but the image is
         * loaded from the memory object rather than from a file. The
         * memory object can be a string or buffer.
         * @param data The memory object to load the image from.
         * @param strOptions Load options as a string.
         * @param options Optional options that depend on the load operation.
         * @return A new image.
         */
        static newFromBuffer(data: Blob, strOptions?: string, options?: {
            /**
             * Hint the expected access pattern for the image.
             */
            access?: Access | Enum
            /**
             * The type of error that will cause load to fail. By default,
             * loaders are permissive, that is, {@link FailOn.none}.
             */
            fail_on?: FailOn | Enum
        }): Image;

        /**
         * Load a formatted image from a source.
         *
         * This behaves exactly as {@link newFromFile}, but the image is
         * loaded from a source rather than from a file.
         * @param source The source to load the image from.
         * @param strOptions Load options as a string.
         * @param options Optional options that depend on the load operation.
         * @return A new image.
         */
        static newFromSource(source: Source, strOptions?: string, options?: {
            /**
             * Hint the expected access pattern for the image.
             */
            access?: Access | Enum
            /**
             * The type of error that will cause load to fail. By default,
             * loaders are permissive, that is, {@link FailOn.none}.
             */
            fail_on?: FailOn | Enum
        }): Image;

        /**
         * Create an image from a 1D array.
         *
         * A new one-band image with {@link BandFormat.double} pixels is
         * created from the array. These images are useful with the libvips
         * convolution operator {@link conv}.
         * @param width Image width.
         * @param height Image height.
         * @param array Create the image from these values.
         * @return A new image.
         */
        static newMatrix(width: number, height: number, array?: ArrayConstant): Image;

        /**
         * Create an image from a 2D array.
         *
         * A new one-band image with {@link BandFormat.double} pixels is
         * created from the array. These images are useful with the libvips
         * convolution operator {@link conv}.
         * @param array Create the image from these values.
         * @param scale Default to 1.0. What to divide each pixel by after
         * convolution. Useful for integer convolution masks.
         * @param offset Default to 0.0. What to subtract from each pixel
         * after convolution. Useful for integer convolution masks.
         * @return A new image.
         */
        static newFromArray(array: ArrayConstant, scale?: number, offset?: number): Image;

        /**
         * Make a new image from an existing one.
         *
         * A new image is created which has the same size, format, interpretation
         * and resolution as itself, but with every pixel set to `value`.
         * @param value The value for the pixels. Use a single number to make a
         * one-band image; use an array constant to make a many-band image.
         * @return A new image.
         */
        newFromImage(value: ArrayConstant): Image;

        /**
         * Copy an image to memory.
         *
         * A large area of memory is allocated, the image is rendered to that
         * memory area, and a new image is returned which wraps that large memory
         * area.
         * @return A new image.
         */
        copyMemory(): Image;

        //#endregion

        //#region Writer functions

        /**
         * Write an image to another image.
         *
         * This function writes itself to another image. Use something like
         * {@link newTempFile} to make an image that can be written to.
         * @param other The image to write to.
         * @return A new image.
         */
        write(other: Image): Image;

        /**
         * Write an image to a file.
         *
         * This method can save images in any format supported by libvips. The format
         * is selected from the filename suffix. The filename can include embedded
         * save options, see {@link newFromFile}.
         *
         * For example:
         * ```js
         * image.writeToFile('fred.jpg[Q=95]');
         * ```
         * You can also supply options as keyword arguments, for example:
         * ```js
         * image.writeToFile('.fred.jpg', {
         *     Q: 95
         * });
         * ```
         * The full set of options available depend upon the save operation that
         * will be executed. Try something like:
         * ```bash
         * $ vips jpegsave
         * ```
         * at the command-line to see a summary of the available options for the
         * JPEG saver.
         * @param vipsFilename The file to save the image to, with optional appended arguments.
         * @param options Optional options that depend on the save operation.
         */
        writeToFile(vipsFilename: string, options?: {}): void;

        /**
         * Write an image to a typed array of 8-bit unsigned integer values.
         *
         * This method can save images in any format supported by libvips. The format
         * is selected from the suffix in the format string. This can include
         * embedded save options, see {@link newFromFile}.
         *
         * For example:
         * ```js
         * const data = image.writeToBuffer('.jpg[Q=95]');
         * ```
         * You can also supply options as keyword arguments, for example:
         * ```js
         * const data = image.writeToBuffer('.jpg', {
         *     Q: 85
         * });
         * ```
         * The full set of options available depend upon the load operation that
         * will be executed. Try something like:
         * ```bash
         * $ vips jpegsave_buffer
         * ```
         * at the command-line to see a summary of the available options for the
         * JPEG saver.
         * @param formatString The suffix, plus any string-form arguments.
         * @param options Optional options that depend on the save operation.
         * @return A typed array of 8-bit unsigned integer values.
         */
        writeToBuffer(formatString: string, options?: {}): Uint8Array;

        /**
         * Write an image to a target.
         *
         * This behaves exactly as {@link writeToFile}, but the image is
         * written to a target rather than a file.
         * @param target Write to this target.
         * @param formatString The suffix, plus any string-form arguments.
         * @param options Optional options that depend on the save operation.
         */
        writeToTarget(target: Target, formatString: string, options?: {}): void;

        /**
         * Write the image to a large memory array.
         *
         * A large area of memory is allocated, the image is rendered to that
         * memory array, and the array is returned as a typed array.
         *
         * For example, if you have a 2x2 uchar image containing the bytes 1, 2,
         * 3, 4, read left-to-right, top-to-bottom, then:
         * ```js
         * const array = Uint8Array.of(1, 2, 3, 4);
         * const im = vips.Image.newFromMemory(array, 2, 2, 1, 'uchar');
         * const buf = im.writeToMemory();
         * ```
         * will return a four byte typed array containing the values 1, 2, 3, 4.
         * @return A typed array of 8-bit unsigned integer values.
         */
        writeToMemory(): Memory;

        //#endregion

        //#region get/set metadata

        /**
         * Set an integer on an image as metadata.
         * @param name The name of the piece of metadata to set the value of.
         * @param value The metadata value.
         */
        setInt(name: string, value: number): void;

        /**
         * Set an integer array on an image as metadata.
         * @param name The name of the piece of metadata to set the value of.
         * @param value The metadata value.
         */
        setArrayInt(name: string, value: ArrayConstant): void;

        /**
         * Set a double array on an image as metadata.
         * @param name The name of the piece of metadata to set the value of.
         * @param value The metadata value.
         */
        setArrayDouble(name: string, value: ArrayConstant): void;

        /**
         * Set a double on an image as metadata.
         * @param name The name of the piece of metadata to set the value of.
         * @param value The metadata value.
         */
        setDouble(name: string, value: number): void;

        /**
         * Set a string on an image as metadata.
         * @param name The name of the piece of metadata to set the value of.
         * @param value The metadata value.
         */
        setString(name: string, value: string): void;

        /**
         * Set an image to another image as metadata.
         * This is typically used to update the gainmap.
         * @param name The name of the piece of metadata to set the value of.
         * @param value The metadata value.
         */
        setImage(name: string, value: Image): void;

        /**
         * Set a blob on an image as metadata.
         * The value will internally be copied from JavaScript to WASM.
         * @param name The name of the piece of metadata to set the value of.
         * @param value The metadata value.
         */
        setBlob(name: string, value: Blob): void;

        /**
         * Set a blob pointer on an image as metadata.
         * @param name The name of the piece of metadata to set the value of.
         * @param ptr The metadata value as memory address.
         * @param size Length of blob.
         */
        setBlob(name: string, ptr: number, size: number): void;

        /**
         * Get the GType of an item of metadata.
         * Fetch the GType of a piece of metadata, or 0 if the named item does not exist.
         * @param name The name of the piece of metadata to get the type of.
         * @return The GType, or `0` if not found.
         */
        getTypeof(name: string): number;

        /**
         * Get an integer from an image.
         * @param name The name of the piece of metadata to get.
         * @return The metadata item as an integer.
         */
        getInt(name: string): number;

        /**
         * Get an integer array from an image.
         * @param name The name of the piece of metadata to get.
         * @return The metadata item as an integer array.
         */
        getArrayInt(name: string): number[];

        /**
         * Get a double array from an image.
         * @param name The name of the piece of metadata to get.
         * @return The metadata item as a double array.
         */
        getArrayDouble(name: string): number[];

        /**
         * Get an double from an image.
         * @param name The name of the piece of metadata to get.
         * @return The metadata item as a double.
         */
        getDouble(name: string): number;

        /**
         * Get a string from an image.
         * @param name The name of the piece of metadata to get.
         * @return The metadata item as a string.
         */
        getString(name: string): string;

        /**
         * Get a blob from an image.
         * @param name The name of the piece of metadata to get.
         * @return The metadata item as a typed array of 8-bit unsigned integer values.
         */
        getBlob(name: string): Uint8Array;

        /**
         * Get a list of all the metadata fields on an image.
         * @return All metadata fields as string vector.
         */
        getFields(): Vector<string>;

        /**
         * Remove an item of metadata.
         * @param name The name of the piece of metadata to remove.
         * @return `true` if successfully removed.
         */
        remove(name: string): boolean;

        //#endregion

        //#region Handwritten functions

        /**
         * Does this image have an alpha channel?
         * @return `true` if this image has an alpha channel.
         */
        hasAlpha(): boolean;

        /**
         * Sets the `delete_on_close` flag for the image.
         * If this flag is set, when image is finalized, the filename held in
         * {@link image.filename} at the time of this call is deleted.
         * This function is clearly extremely dangerous, use with great caution.
         */
        setDeleteOnClose(flag: boolean): void;

        /**
         * Search an image for non-edge areas.
         * @param options Optional options.
         * @return The bounding box of the non-background area.
         */
        findTrim(options?: {
            /**
             * Object threshold.
             */
            threshold?: number
            /**
             * Color for background pixels.
             */
            background?: ArrayConstant
            /**
             * Enable line art mode.
             */
            line_art?: boolean
        }): {
            /**
             * Output left edge.
             */
            left: number

            /**
             * Output top edge.
             */
            top: number

            /**
             * Output width.
             */
            width: number

            /**
             * Output width.
             */
            height: number
        };

        /**
         * Find image profiles.
         * @return First non-zero pixel in column/row.
         */
        profile(): {
            /**
             * Distances from top edge.
             */
            columns: Image

            /**
             * Distances from left edge.
             */
            rows: Image
        };

        /**
         * Find image projections.
         * @return Sums of columns/rows.
         */
        project(): {
            /**
             * Sums of columns.
             */
            columns: Image

            /**
             * Sums of rows.
             */
            rows: Image
        };

        /**
         * Split an n-band image into n separate images.
         * @return Vector of output images.
         */
        bandsplit(): Vector<Image>;

        //#endregion

        //#region Instance overloads

        /**
         * Append a set of images or constants bandwise
         * @param _in Array of input images.
         * @return Output image.
         */
        bandjoin(_in: ArrayImage | ArrayConstant): Image;

        /**
         * Band-wise rank filter a set of images or constants.
         * @param _in Array of input images.
         * @param options Optional options.
         * @return Output image.
         */
        bandrank(_in: ArrayImage | ArrayConstant, options?: {
            /**
             * Select this band element from sorted list.
             */
            index?: number
        }): Image;

        /**
         * Composite a set of images with a set of blend modes.
         * @param _in Images to composite.
         * @param mode Blend modes to use.
         * @param options Optional options.
         * @return Blended image.
         */
        static composite(_in: ArrayImage, mode: SingleOrArray<BlendMode>, options?: {
            /**
             * Array of x coordinates to join at.
             */
            x?: ArrayConstant
            /**
             * Array of y coordinates to join at.
             */
            y?: ArrayConstant
            /**
             * Composite images in this colour space.
             */
            compositing_space?: Interpretation | Enum
            /**
             * Images have premultiplied alpha.
             */
            premultiplied?: boolean
        }): Image;

        /**
         * Composite a set of images with a set of blend modes.
         * @param overlay Images to composite.
         * @param mode Blend modes to use.
         * @param options Optional options.
         * @return Blended image.
         */
        composite(overlay: ArrayImage, mode: SingleOrArray<BlendMode>, options?: {
            /**
             * Array of x coordinates to join at.
             */
            x?: ArrayConstant
            /**
             * Array of y coordinates to join at.
             */
            y?: ArrayConstant
            /**
             * Composite images in this colour space.
             */
            compositing_space?: Interpretation | Enum
            /**
             * Images have premultiplied alpha.
             */
            premultiplied?: boolean
        }): Image;

        //#endregion

        //#region Extra utility functions

        /**
         * Return the coordinates of the image maximum.
         * @return Array of output values.
         */
        maxPos(): number[];

        /**
         * Return the coordinates of the image minimum.
         * @return Array of output values.
         */
        minPos(): number[];

        //#endregion

        //#region Enum overloads

        /**
         * Flip an image horizontally.
         * @return Output image.
         */
        flipHor(): Image;

        /**
         * Flip an image vertically.
         * @return Output image.
         */
        flipVer(): Image;

        /**
         * Rotate an image 90 degrees clockwise.
         * @return Output image.
         */
        rot90(): Image;

        /**
         * Rotate an image 180 degrees.
         * @return Output image.
         */
        rot180(): Image;

        /**
         * Rotate an image 270 degrees clockwise.
         * @return Output image.
         */
        rot270(): Image;

        /**
         * size x size median filter.
         * @param size The size of the median filter, defaults to 3.
         * @return Output image.
         */
        median(size?: number): Image;

        /**
         * Return the largest integral value not greater than the argument.
         * @return Output image.
         */
        floor(): Image;

        /**
         * Return the smallest integral value not less than the argument.
         * @return Output image.
         */
        ceil(): Image;

        /**
         * Return the nearest integral value.
         * @return Output image.
         */
        rint(): Image;

        /**
         * AND image bands together.
         * @return Output image.
         */
        bandand(): Image;

        /**
         * OR image bands together.
         * @return Output image.
         */
        bandor(): Image;

        /**
         * EOR image bands together.
         * @return Output image.
         */
        bandeor(): Image;

        /**
         * Return the real part of a complex image.
         * @return Output image.
         */
        real(): Image;

        /**
         * Return the imaginary part of a complex image.
         * @return Output image.
         */
        imag(): Image;

        /**
         * Return an image converted to polar coordinates.
         * @return Output image.
         */
        polar(): Image;

        /**
         * Return an image converted to rectangular coordinates.
         * @return Output image.
         */
        rect(): Image;

        /**
         * Return the complex conjugate of an image.
         * @return Output image.
         */
        conj(): Image;

        /**
         * Return the sine of an image in degrees.
         * @return Output image.
         */
        sin(): Image;

        /**
         * Return the cosine of an image in degrees.
         * @return Output image.
         */
        cos(): Image;

        /**
         * Return the tangent of an image in degrees.
         * @return Output image.
         */
        tan(): Image;

        /**
         * Return the inverse sine of an image in degrees.
         * @return Output image.
         */
        asin(): Image;

        /**
         * Return the inverse cosine of an image in degrees.
         * @return Output image.
         */
        acos(): Image;

        /**
         * Return the inverse tangent of an image in degrees.
         * @return Output image.
         */
        atan(): Image;

        /**
         * Return the hyperbolic sine of an image in radians.
         * @return Output image.
         */
        sinh(): Image;

        /**
         * Return the hyperbolic cosine of an image in radians.
         * @return Output image.
         */
        cosh(): Image;

        /**
         * Return the hyperbolic tangent of an image in radians.
         * @return Output image.
         */
        tanh(): Image;

        /**
         * Return the inverse hyperbolic sine of an image in radians.
         * @return Output image.
         */
        asinh(): Image;

        /**
         * Return the inverse hyperbolic cosine of an image in radians.
         * @return Output image.
         */
        acosh(): Image;

        /**
         * Return the inverse hyperbolic tangent of an image in radians.
         * @return Output image.
         */
        atanh(): Image;

        /**
         * Return the natural log of an image.
         * @return Output image.
         */
        log(): Image;

        /**
         * Return the log base 10 of an image.
         * @return Output image.
         */
        log10(): Image;

        /**
         * Return e ** pixel.
         * @return Output image.
         */
        exp(): Image;

        /**
         * Return 10 ** pixel.
         * @return Output image.
         */
        exp10(): Image;

        //#endregion

        //#region Constant/image overloads

        /**
         * Erode with a structuring element.
         * @param mask Input matrix image.
         * @return Output image.
         */
        erode(mask: Image | ArrayConstant): Image;

        /**
         * Dilate with a structuring element.
         * @param mask Input matrix image.
         * @return Output image.
         */
        dilate(mask: Image | ArrayConstant): Image;

        /**
         * Raise to power of an image or constant.
         * @param right To the power of this.
         * @return Output image.
         */
        pow(right: Image | ArrayConstant): Image;

        /**
         * Raise to power of an image, but with the arguments reversed.
         * @param right To the power of this.
         * @return Output image.
         */
        wop(right: Image | ArrayConstant): Image;

        /**
         * Arc tangent of an image or constant.
         * @param right Divisor parameter.
         * @return Output image.
         */
        atan2(right: Image | ArrayConstant): Image;

        /**
         * Performs a bitwise left shift operation (<<).
         * @param right Right operand.
         * @return Output image.
         */
        lshift(right: Image | ArrayConstant): Image;

        /**
         * Performs a bitwise right shift operation (>>).
         * @param right Right operand.
         * @return Output image.
         */
        rshift(right: Image | ArrayConstant): Image;

        /**
         * Performs a bitwise AND operation (&).
         * @param right Right operand.
         * @return Output image.
         */
        and(right: Image | ArrayConstant): Image;

        /**
         * Performs a bitwise OR operation (|) .
         * @param right Right operand.
         * @return Output image.
         */
        or(right: Image | ArrayConstant): Image;

        /**
         * Performs a bitwise exclusive-OR operation (^).
         * @param right Right operand.
         * @return Output image.
         */
        eor(right: Image | ArrayConstant): Image;

        /**
         * Performs a relational greater than operation (>).
         * @param right Right operand.
         * @return Output image.
         */
        more(right: Image | ArrayConstant): Image;

        /**
         * Performs a relational greater than or equal operation (>=).
         * @param right Right operand.
         * @return Output image.
         */
        moreEq(right: Image | ArrayConstant): Image;

        /**
         * Performs a relational less than operation (<).
         * @param right Right operand.
         * @return Output image.
         */
        less(right: Image | ArrayConstant): Image;

        /**
         * Performs a relational less than or equal operation (<=).
         * @param right Right operand.
         * @return Output image.
         */
        lessEq(right: Image | ArrayConstant): Image;

        /**
         * Performs a relational equality operation (==).
         * @param right Right operand.
         * @return Output image.
         */
        equal(right: Image | ArrayConstant): Image;

        /**
         * Performs a relational inequality operation (!=).
         * @param right Right operand.
         * @return Output image.
         */
        notEq(right: Image | ArrayConstant): Image;

        //#endregion
    }

    //#endregion

    //#region Auto-generated enumerations

    /**
     * The format used for each band element.
     *
     * Each corresponds to a native C type for the current machine. For example,
     * [enum@Vips.BandFormat.USHORT] is `unsigned short`.
     */
    enum BandFormat {
        /**
         * Unsigned char format
         */
        uchar = 0, // 'uchar'
        /**
         * Char format
         */
        char = 1, // 'char'
        /**
         * Unsigned short format
         */
        ushort = 2, // 'ushort'
        /**
         * Short format
         */
        short = 3, // 'short'
        /**
         * Unsigned int format
         */
        uint = 4, // 'uint'
        /**
         * Int format
         */
        int = 5, // 'int'
        /**
         * Float format
         */
        float = 6, // 'float'
        /**
         * Complex (two floats) format
         */
        complex = 7, // 'complex'
        /**
         * Double float format
         */
        double = 8, // 'double'
        /**
         * Double complex (two double) format
         */
        dpcomplex = 9 // 'dpcomplex'
    }

    /**
     * The various Porter-Duff and PDF blend modes. See [func@Image.composite],
     * for example.
     *
     * The Cairo docs have [a nice explanation of all the blend
     * modes](https://www.cairographics.org/operators).
     *
     * The non-separable modes are not implemented.
     */
    enum BlendMode {
        /**
         * Where the second object is drawn, the first is removed
         */
        clear = 0, // 'clear'
        /**
         * The second object is drawn as if nothing were below
         */
        source = 1, // 'source'
        /**
         * The image shows what you would expect if you held two semi-transparent slides on top of each other
         */
        over = 2, // 'over'
        /**
         * The first object is removed completely, the second is only drawn where the first was
         */
        in = 3, // 'in'
        /**
         * The second is drawn only where the first isn't
         */
        out = 4, // 'out'
        /**
         * This leaves the first object mostly intact, but mixes both objects in the overlapping area
         */
        atop = 5, // 'atop'
        /**
         * Leaves the first object untouched, the second is discarded completely
         */
        dest = 6, // 'dest'
        /**
         * Like OVER, but swaps the arguments
         */
        dest_over = 7, // 'dest-over'
        /**
         * Like IN, but swaps the arguments
         */
        dest_in = 8, // 'dest-in'
        /**
         * Like OUT, but swaps the arguments
         */
        dest_out = 9, // 'dest-out'
        /**
         * Like ATOP, but swaps the arguments
         */
        dest_atop = 10, // 'dest-atop'
        /**
         * Something like a difference operator
         */
        xor = 11, // 'xor'
        /**
         * A bit like adding the two images
         */
        add = 12, // 'add'
        /**
         * A bit like the darker of the two
         */
        saturate = 13, // 'saturate'
        /**
         * At least as dark as the darker of the two inputs
         */
        multiply = 14, // 'multiply'
        /**
         * At least as light as the lighter of the inputs
         */
        screen = 15, // 'screen'
        /**
         * Multiplies or screens colors, depending on the lightness
         */
        overlay = 16, // 'overlay'
        /**
         * The darker of each component
         */
        darken = 17, // 'darken'
        /**
         * The lighter of each component
         */
        lighten = 18, // 'lighten'
        /**
         * Brighten first by a factor second
         */
        colour_dodge = 19, // 'colour-dodge'
        /**
         * Darken first by a factor of second
         */
        colour_burn = 20, // 'colour-burn'
        /**
         * Multiply or screen, depending on lightness
         */
        hard_light = 21, // 'hard-light'
        /**
         * Darken or lighten, depending on lightness
         */
        soft_light = 22, // 'soft-light'
        /**
         * Difference of the two
         */
        difference = 23, // 'difference'
        /**
         * Somewhat like DIFFERENCE, but lower-contrast
         */
        exclusion = 24 // 'exclusion'
    }

    /**
     * How pixels are coded.
     *
     * Normally, pixels are uncoded and can be manipulated as you would expect.
     * However some file formats code pixels for compression, and sometimes it's
     * useful to be able to manipulate images in the coded format.
     *
     * The gaps in the numbering are historical and must be maintained. Allocate
     * new numbers from the end.
     */
    enum Coding {
        /**
         * Pixels are not coded
         */
        none = 0, // 'none'
        /**
         * Pixels encode 3 float CIELAB values as 4 uchar
         */
        labq = 2, // 'labq'
        /**
         * Pixels encode 3 float RGB as 4 uchar (Radiance coding)
         */
        rad = 6 // 'rad'
    }

    /**
     * How the values in an image should be interpreted. For example, a
     * three-band float image of type [enum@Vips.Interpretation.LAB] should have its
     * pixels interpreted as coordinates in CIE Lab space.
     *
     * RGB and sRGB are treated in the same way. Use the colourspace functions if
     * you want some other behaviour.
     *
     * The gaps in numbering are historical and must be maintained. Allocate
     * new numbers from the end.
     */
    enum Interpretation {
        /**
         * Generic many-band image
         */
        multiband = 0, // 'multiband'
        /**
         * Some kind of single-band image
         */
        b_w = 1, // 'b-w'
        /**
         * A 1D image, eg. histogram or lookup table
         */
        histogram = 10, // 'histogram'
        /**
         * The first three bands are CIE XYZ
         */
        xyz = 12, // 'xyz'
        /**
         * Pixels are in CIE Lab space
         */
        lab = 13, // 'lab'
        /**
         * The first four bands are in CMYK space
         */
        cmyk = 15, // 'cmyk'
        /**
         * Implies [enum@Vips.Coding.LABQ]
         */
        labq = 16, // 'labq'
        /**
         * Generic RGB space
         */
        rgb = 17, // 'rgb'
        /**
         * A uniform colourspace based on CMC(1:1)
         */
        cmc = 18, // 'cmc'
        /**
         * Pixels are in CIE LCh space
         */
        lch = 19, // 'lch'
        /**
         * CIE LAB coded as three signed 16-bit values
         */
        labs = 21, // 'labs'
        /**
         * Pixels are sRGB
         */
        srgb = 22, // 'srgb'
        /**
         * Pixels are CIE Yxy
         */
        yxy = 23, // 'yxy'
        /**
         * Image is in fourier space
         */
        fourier = 24, // 'fourier'
        /**
         * Generic 16-bit RGB
         */
        rgb16 = 25, // 'rgb16'
        /**
         * Generic 16-bit mono
         */
        grey16 = 26, // 'grey16'
        /**
         * A matrix
         */
        matrix = 27, // 'matrix'
        /**
         * Pixels are scRGB
         */
        scrgb = 28, // 'scrgb'
        /**
         * Pixels are HSV
         */
        hsv = 29, // 'hsv'
        /**
         * Pixels are in Oklab colourspace
         */
        oklab = 30, // 'oklab'
        /**
         * Pixels are in Oklch colourspace
         */
        oklch = 31 // 'oklch'
    }

    /**
     * See also: [method@Image.relational].
     */
    enum OperationRelational {
        /**
         * `==`
         */
        equal = 0, // 'equal'
        /**
         * `!=`
         */
        noteq = 1, // 'noteq'
        /**
         * `<`
         */
        less = 2, // 'less'
        /**
         * `<=`
         */
        lesseq = 3, // 'lesseq'
        /**
         * `>`
         */
        more = 4, // 'more'
        /**
         * `>=`
         */
        moreeq = 5 // 'moreeq'
    }

    /**
     * See also: [method@Image.boolean].
     */
    enum OperationBoolean {
        /**
         * `&`
         */
        and = 0, // 'and'
        /**
         * `|`
         */
        or = 1, // 'or'
        /**
         * `^`
         */
        eor = 2, // 'eor'
        /**
         * `>>`
         */
        lshift = 3, // 'lshift'
        /**
         * `<<`
         */
        rshift = 4 // 'rshift'
    }

    /**
     * See also: [method@Image.math].
     */
    enum OperationMath2 {
        /**
         * `pow(left, right)`
         */
        pow = 0, // 'pow'
        /**
         * `pow(right, left)`
         */
        wop = 1, // 'wop'
        /**
         * `atan2(left, right)`
         */
        atan2 = 2 // 'atan2'
    }

    /**
     * See also: [method@Image.complex2].
     */
    enum OperationComplex2 {
        /**
         * Convert to polar coordinates
         */
        cross_phase = 0 // 'cross-phase'
    }

    /**
     * See also: [method@Image.math].
     */
    enum OperationMath {
        /**
         * `sin()`, angles in degrees
         */
        sin = 0, // 'sin'
        /**
         * `cos()`, angles in degrees
         */
        cos = 1, // 'cos'
        /**
         * `tan()`, angles in degrees
         */
        tan = 2, // 'tan'
        /**
         * `asin()`, angles in degrees
         */
        asin = 3, // 'asin'
        /**
         * `acos()`, angles in degrees
         */
        acos = 4, // 'acos'
        /**
         * `atan()`, angles in degrees
         */
        atan = 5, // 'atan'
        /**
         * Log base e
         */
        log = 6, // 'log'
        /**
         * Log base 10
         */
        log10 = 7, // 'log10'
        /**
         * E to the something
         */
        exp = 8, // 'exp'
        /**
         * 10 to the something
         */
        exp10 = 9, // 'exp10'
        /**
         * `sinh()`, angles in radians
         */
        sinh = 10, // 'sinh'
        /**
         * `cosh()`, angles in radians
         */
        cosh = 11, // 'cosh'
        /**
         * `tanh()`, angles in radians
         */
        tanh = 12, // 'tanh'
        /**
         * `asinh()`, angles in radians
         */
        asinh = 13, // 'asinh'
        /**
         * `acosh()`, angles in radians
         */
        acosh = 14, // 'acosh'
        /**
         * `atanh()`, angles in radians
         */
        atanh = 15 // 'atanh'
    }

    /**
     * See also: [method@Image.round].
     */
    enum OperationRound {
        /**
         * Round to nearest
         */
        rint = 0, // 'rint'
        /**
         * The smallest integral value not less than
         */
        ceil = 1, // 'ceil'
        /**
         * Largest integral value not greater than
         */
        floor = 2 // 'floor'
    }

    /**
     * See also: [method@Image.complex].
     */
    enum OperationComplex {
        /**
         * Convert to polar coordinates
         */
        polar = 0, // 'polar'
        /**
         * Convert to rectangular coordinates
         */
        rect = 1, // 'rect'
        /**
         * Complex conjugate
         */
        conj = 2 // 'conj'
    }

    /**
     * See also: [method@Image.complexget].
     */
    enum OperationComplexget {
        /**
         * Get real component
         */
        real = 0, // 'real'
        /**
         * Get imaginary component
         */
        imag = 1 // 'imag'
    }

    /**
     * How to combine values. See [method@Image.compass], for example.
     */
    enum Combine {
        /**
         * Take the maximum of the possible values
         */
        max = 0, // 'max'
        /**
         * Sum all the values
         */
        sum = 1, // 'sum'
        /**
         * Take the minimum value
         */
        min = 2 // 'min'
    }

    /**
     * The type of access an operation has to supply. See [method@Image.tilecache]
     * and [class@Foreign].
     *
     * [enum@Vips.Access.RANDOM] means requests can come in any order.
     *
     * [enum@Vips.Access.SEQUENTIAL] means requests will be top-to-bottom, but with some
     * amount of buffering behind the read point for small non-local accesses.
     */
    enum Access {
        /**
         * Can read anywhere
         */
        random = 0, // 'random'
        /**
         * Top-to-bottom reading only, but with a small buffer
         */
        sequential = 1 // 'sequential'
    }

    /**
     * See [method@Image.embed], [method@Image.conv], [method@Image.affine] and so on.
     *
     * When the edges of an image are extended, you can specify
     * how you want the extension done.
     *
     * [enum@Vips.Extend.BLACK] -- new pixels are black, ie. all bits are zero.
     *
     * [enum@Vips.Extend.COPY] -- each new pixel takes the value of the nearest edge
     * pixel
     *
     * [enum@Vips.Extend.REPEAT] -- the image is tiled to fill the new area
     *
     * [enum@Vips.Extend.MIRROR] -- the image is reflected and tiled to reduce hash
     * edges
     *
     * [enum@Vips.Extend.WHITE] -- new pixels are white, ie. all bits are set
     *
     * [enum@Vips.Extend.BACKGROUND] -- colour set from the @background property
     *
     * We have to specify the exact value of each enum member since we have to
     * keep these frozen for back compat with vips7.
     *
     * ::: seealso
     *     [method@Image.embed].
     */
    enum Extend {
        /**
         * Extend with black (all 0) pixels
         */
        black = 0, // 'black'
        /**
         * Copy the image edges
         */
        copy = 1, // 'copy'
        /**
         * Repeat the whole image
         */
        repeat = 2, // 'repeat'
        /**
         * Mirror the whole image
         */
        mirror = 3, // 'mirror'
        /**
         * Extend with white (all bits set) pixels
         */
        white = 4, // 'white'
        /**
         * Extend with colour from the @background property
         */
        background = 5 // 'background'
    }

    /**
     * A direction on a compass. Used for [method@Image.gravity], for example.
     */
    enum CompassDirection {
        /**
         * Centre
         */
        centre = 0, // 'centre'
        /**
         * North
         */
        north = 1, // 'north'
        /**
         * East
         */
        east = 2, // 'east'
        /**
         * South
         */
        south = 3, // 'south'
        /**
         * West
         */
        west = 4, // 'west'
        /**
         * North-east
         */
        north_east = 5, // 'north-east'
        /**
         * South-east
         */
        south_east = 6, // 'south-east'
        /**
         * South-west
         */
        south_west = 7, // 'south-west'
        /**
         * North-west
         */
        north_west = 8 // 'north-west'
    }

    /**
     * See [method@Image.flip], [method@Image.join] and so on.
     *
     * Operations like [method@Image.flip] need to be told whether to flip left-right or
     * top-bottom.
     *
     * ::: seealso
     *     [method@Image.flip], [method@Image.join].
     */
    enum Direction {
        /**
         * Left-right
         */
        horizontal = 0, // 'horizontal'
        /**
         * Top-bottom
         */
        vertical = 1 // 'vertical'
    }

    /**
     * See [method@Image.join] and so on.
     *
     * Operations like [method@Image.join] need to be told whether to align images on the
     * low or high coordinate edge, or centre.
     *
     * ::: seealso
     *     [method@Image.join].
     */
    enum Align {
        /**
         * Align low coordinate edge
         */
        low = 0, // 'low'
        /**
         * Align centre
         */
        centre = 1, // 'centre'
        /**
         * Align high coordinate edge
         */
        high = 2 // 'high'
    }

    /**
     * Pick the algorithm vips uses to decide image "interestingness". This is used
     * by [method@Image.smartcrop], for example, to decide what parts of the image to
     * keep.
     *
     * [enum@Vips.Interesting.NONE] and [enum@Vips.Interesting.LOW] mean the same -- the
     * crop is positioned at the top or left. [enum@Vips.Interesting.HIGH] positions at
     * the bottom or right.
     *
     * ::: seealso
     *     [method@Image.smartcrop].
     */
    enum Interesting {
        /**
         * Do nothing
         */
        none = 0, // 'none'
        /**
         * Just take the centre
         */
        centre = 1, // 'centre'
        /**
         * Use an entropy measure
         */
        entropy = 2, // 'entropy'
        /**
         * Look for features likely to draw human attention
         */
        attention = 3, // 'attention'
        /**
         * Position the crop towards the low coordinate
         */
        low = 4, // 'low'
        /**
         * Position the crop towards the high coordinate
         */
        high = 5, // 'high'
        /**
         * Everything is interesting
         */
        all = 6 // 'all'
    }

    /**
     * See [method@Image.rot] and so on.
     *
     * Fixed rotate angles.
     *
     * ::: seealso
     *     [method@Image.rot].
     */
    enum Angle {
        /**
         * No rotate
         */
        d0 = 0, // 'd0'
        /**
         * 90 degrees clockwise
         */
        d90 = 1, // 'd90'
        /**
         * 180 degree rotate
         */
        d180 = 2, // 'd180'
        /**
         * 90 degrees anti-clockwise
         */
        d270 = 3 // 'd270'
    }

    /**
     * See [method@Image.rot45] and so on.
     *
     * Fixed rotate angles.
     *
     * ::: seealso
     *     [method@Image.rot45].
     */
    enum Angle45 {
        /**
         * No rotate
         */
        d0 = 0, // 'd0'
        /**
         * 45 degrees clockwise
         */
        d45 = 1, // 'd45'
        /**
         * 90 degrees clockwise
         */
        d90 = 2, // 'd90'
        /**
         * 135 degrees clockwise
         */
        d135 = 3, // 'd135'
        /**
         * 180 degrees
         */
        d180 = 4, // 'd180'
        /**
         * 135 degrees anti-clockwise
         */
        d225 = 5, // 'd225'
        /**
         * 90 degrees anti-clockwise
         */
        d270 = 6, // 'd270'
        /**
         * 45 degrees anti-clockwise
         */
        d315 = 7 // 'd315'
    }

    /**
     * How accurate an operation should be.
     */
    enum Precision {
        /**
         * Int everywhere
         */
        integer = 0, // 'integer'
        /**
         * Float everywhere
         */
        float = 1, // 'float'
        /**
         * Approximate integer output
         */
        approximate = 2 // 'approximate'
    }

    /**
     * The SDF to generate,
     *
     * ::: seealso
     *     [ctor@Image.sdf].
     */
    enum SdfShape {
        /**
         * A circle at @a, radius @r
         */
        circle = 0, // 'circle'
        /**
         * A box from @a to @b
         */
        box = 1, // 'box'
        /**
         * A box with rounded @corners from @a to @b
         */
        rounded_box = 2, // 'rounded-box'
        /**
         * A line from @a to @b
         */
        line = 3 // 'line'
    }

    /**
     * How sensitive loaders are to errors, from never stop (very insensitive), to
     * stop on the smallest warning (very sensitive).
     *
     * Each one implies the ones before it, so [enum@Vips.FailOn.ERROR] implies
     * [enum@Vips.FailOn.TRUNCATED].
     */
    enum FailOn {
        /**
         * Never stop
         */
        none = 0, // 'none'
        /**
         * Stop on image truncated, nothing else
         */
        truncated = 1, // 'truncated'
        /**
         * Stop on serious error or truncation
         */
        error = 2, // 'error'
        /**
         * Stop on anything, even warnings
         */
        warning = 3 // 'warning'
    }

    /**
     * The netpbm file format to save as.
     *
     * [enum@Vips.ForeignPpmFormat.PBM] images are single bit.
     *
     * [enum@Vips.ForeignPpmFormat.PGM] images are 8, 16, or 32-bits, one band.
     *
     * [enum@Vips.ForeignPpmFormat.PPM] images are 8, 16, or 32-bits, three bands.
     *
     * [enum@Vips.ForeignPpmFormat.PFM] images are 32-bit float pixels.
     *
     * [enum@Vips.ForeignPpmFormat.PNM] images are anymap images -- the image format
     * is used to pick the saver.
     */
    enum ForeignPpmFormat {
        /**
         * Portable bitmap
         */
        pbm = 0, // 'pbm'
        /**
         * Portable greymap
         */
        pgm = 1, // 'pgm'
        /**
         * Portable pixmap
         */
        ppm = 2, // 'ppm'
        /**
         * Portable float map
         */
        pfm = 3, // 'pfm'
        /**
         * Portable anymap
         */
        pnm = 4 // 'pnm'
    }

    /**
     * Set subsampling mode.
     */
    enum ForeignSubsample {
        /**
         * Prevent subsampling when quality >= 90
         */
        auto = 0, // 'auto'
        /**
         * Always perform subsampling
         */
        on = 1, // 'on'
        /**
         * Never perform subsampling
         */
        off = 2 // 'off'
    }

    /**
     * Tune lossy encoder settings for different image types.
     */
    enum ForeignWebpPreset {
        /**
         * Default preset
         */
        default = 0, // 'default'
        /**
         * Digital picture, like portrait, inner shot
         */
        picture = 1, // 'picture'
        /**
         * Outdoor photograph, with natural lighting
         */
        photo = 2, // 'photo'
        /**
         * Hand or line drawing, with high-contrast details
         */
        drawing = 3, // 'drawing'
        /**
         * Small-sized colorful images
         */
        icon = 4, // 'icon'
        /**
         * Text-like
         */
        text = 5 // 'text'
    }

    /**
     * The compression types supported by the tiff writer.
     *
     * Use @Q to set the jpeg compression level, default 75.
     *
     * Use @predictor to set the lzw or deflate prediction, default horizontal.
     *
     * Use @lossless to set WEBP lossless compression.
     *
     * Use @level to set webp and zstd compression level.
     */
    enum ForeignTiffCompression {
        /**
         * No compression
         */
        none = 0, // 'none'
        /**
         * Jpeg compression
         */
        jpeg = 1, // 'jpeg'
        /**
         * Deflate (zip) compression
         */
        deflate = 2, // 'deflate'
        /**
         * Packbits compression
         */
        packbits = 3, // 'packbits'
        /**
         * Fax4 compression
         */
        ccittfax4 = 4, // 'ccittfax4'
        /**
         * LZW compression
         */
        lzw = 5, // 'lzw'
        /**
         * WEBP compression
         */
        webp = 6, // 'webp'
        /**
         * ZSTD compression
         */
        zstd = 7, // 'zstd'
        /**
         * JP2K compression
         */
        jp2k = 8 // 'jp2k'
    }

    /**
     * The predictor can help deflate and lzw compression. The values are fixed by
     * the tiff library.
     */
    enum ForeignTiffPredictor {
        /**
         * No prediction
         */
        none = 1, // 'none'
        /**
         * Horizontal differencing
         */
        horizontal = 2, // 'horizontal'
        /**
         * Float predictor
         */
        float = 3 // 'float'
    }

    /**
     * Use inches or centimeters as the resolution unit for a tiff file.
     */
    enum ForeignTiffResunit {
        /**
         * Use centimeters
         */
        cm = 0, // 'cm'
        /**
         * Use inches
         */
        inch = 1 // 'inch'
    }

    /**
     * How to calculate the output pixels when shrinking a 2x2 region.
     *
     * Images with alpha (see [method@Image.hasalpha]) always shrink with
     * [enum@Vips.RegionShrink.MEAN] and pixels scaled by alpha to avoid fringing.
     *
     * Set the image interpretation to [enum@Vips.Interpretation.MULTIBAND] to
     * treat all bands equally.
     */
    enum RegionShrink {
        /**
         * Use the average
         */
        mean = 0, // 'mean'
        /**
         * Use the median
         */
        median = 1, // 'median'
        /**
         * Use the mode
         */
        mode = 2, // 'mode'
        /**
         * Use the maximum
         */
        max = 3, // 'max'
        /**
         * Use the minimum
         */
        min = 4, // 'min'
        /**
         * Use the top-left pixel
         */
        nearest = 5 // 'nearest'
    }

    /**
     * How many pyramid layers to create.
     */
    enum ForeignDzDepth {
        /**
         * Create layers down to 1x1 pixel
         */
        onepixel = 0, // 'onepixel'
        /**
         * Create layers down to 1x1 tile
         */
        onetile = 1, // 'onetile'
        /**
         * Only create a single layer
         */
        one = 2 // 'one'
    }

    /**
     * The compression format to use inside a HEIF container.
     *
     * This is assumed to use the same numbering as `heif_compression_format`.
     */
    enum ForeignHeifCompression {
        /**
         * X265
         */
        hevc = 1, // 'hevc'
        /**
         * X264
         */
        avc = 2, // 'avc'
        /**
         * Jpeg
         */
        jpeg = 3, // 'jpeg'
        /**
         * Aom
         */
        av1 = 4 // 'av1'
    }

    /**
     * The selected encoder to use.
     * If libheif hasn't been compiled with the selected encoder,
     * we will fallback to the default encoder for the compression format.
     */
    enum ForeignHeifEncoder {
        /**
         * Auto
         */
        auto = 0, // 'auto'
        /**
         * Aom
         */
        aom = 1, // 'aom'
        /**
         * RAV1E
         */
        rav1e = 2, // 'rav1e'
        /**
         * SVT-AV1
         */
        svt = 3, // 'svt'
        /**
         * X265
         */
        x265 = 4 // 'x265'
    }

    /**
     * Controls whether an operation should upsize, downsize, both up and
     * downsize, or force a size.
     *
     * ::: seealso
     *     [ctor@Image.thumbnail].
     */
    enum Size {
        /**
         * Size both up and down
         */
        both = 0, // 'both'
        /**
         * Only upsize
         */
        up = 1, // 'up'
        /**
         * Only downsize
         */
        down = 2, // 'down'
        /**
         * Force size, that is, break aspect ratio
         */
        force = 3 // 'force'
    }

    /**
     * The rendering intent. [enum@Vips.Intent.ABSOLUTE] is best for
     * scientific work, [enum@Vips.Intent.RELATIVE] is usually best for
     * accurate communication with other imaging libraries.
     */
    enum Intent {
        /**
         * Perceptual rendering intent
         */
        perceptual = 0, // 'perceptual'
        /**
         * Relative colorimetric rendering intent
         */
        relative = 1, // 'relative'
        /**
         * Saturation rendering intent
         */
        saturation = 2, // 'saturation'
        /**
         * Absolute colorimetric rendering intent
         */
        absolute = 3, // 'absolute'
        /**
         * The rendering intent that the profile suggests
         */
        auto = 32 // 'auto'
    }

    /**
     * The resampling kernels vips supports. See [method@Image.reduce], for example.
     */
    enum Kernel {
        /**
         * The nearest pixel to the point
         */
        nearest = 0, // 'nearest'
        /**
         * Convolve with a triangle filter
         */
        linear = 1, // 'linear'
        /**
         * Convolve with a cubic filter
         */
        cubic = 2, // 'cubic'
        /**
         * Convolve with a Mitchell kernel
         */
        mitchell = 3, // 'mitchell'
        /**
         * Convolve with a two-lobe Lanczos kernel
         */
        lanczos2 = 4, // 'lanczos2'
        /**
         * Convolve with a three-lobe Lanczos kernel
         */
        lanczos3 = 5, // 'lanczos3'
        /**
         * Convolve with Magic Kernel Sharp 2013
         */
        mks2013 = 6, // 'mks2013'
        /**
         * Convolve with Magic Kernel Sharp 2021
         */
        mks2021 = 7 // 'mks2021'
    }

    /**
     * Pick a Profile Connection Space for [method@Image.icc_import] and
     * [method@Image.icc_export]. LAB is usually best, XYZ can be more convenient in some
     * cases.
     */
    enum PCS {
        /**
         * Use CIELAB D65 as the Profile Connection Space
         */
        lab = 0, // 'lab'
        /**
         * Use XYZ as the Profile Connection Space
         */
        xyz = 1 // 'xyz'
    }

    /**
     * More like hit-miss, really.
     *
     * ::: seealso
     *     [method@Image.morph].
     */
    enum OperationMorphology {
        /**
         * True if all set
         */
        erode = 0, // 'erode'
        /**
         * True if one set
         */
        dilate = 1 // 'dilate'
    }

    /**
     * See [method@Image.draw_image] and so on.
     *
     * Operations like [method@Image.draw_image] need to be told how to combine images
     * from two sources.
     *
     * ::: seealso
     *     [method@Image.join].
     */
    enum CombineMode {
        /**
         * Set pixels to the new value
         */
        set = 0, // 'set'
        /**
         * Add pixels
         */
        add = 1 // 'add'
    }

    /**
     * Which metadata to retain.
     */
    enum ForeignKeep {
        /**
         * Don't attach metadata
         */
        none = 0, // 'none'
        /**
         * Keep Exif metadata
         */
        exif = 1, // 'exif'
        /**
         * Keep XMP metadata
         */
        xmp = 2, // 'xmp'
        /**
         * Keep IPTC metadata
         */
        iptc = 4, // 'iptc'
        /**
         * Keep ICC metadata
         */
        icc = 8, // 'icc'
        /**
         * Keep other metadata (e.g. PNG comments)
         */
        other = 16, // 'other'
        /**
         * Keep the gainmap metadata
         */
        gainmap = 32, // 'gainmap'
        /**
         * Keep all metadata
         */
        all = 63 // 'all'
    }

    /**
     * http://www.w3.org/TR/PNG-Filters.html
     * The values mirror those of png.h in libpng.
     */
    enum ForeignPngFilter {
        /**
         * No filtering
         */
        none = 8, // 'none'
        /**
         * Difference to the left
         */
        sub = 16, // 'sub'
        /**
         * Difference up
         */
        up = 32, // 'up'
        /**
         * Average of left and up
         */
        avg = 64, // 'avg'
        /**
         * Pick best neighbor predictor automatically
         */
        paeth = 128, // 'paeth'
        /**
         * Adaptive
         */
        all = 248 // 'all'
    }

    //#endregion

    //#region Auto-generated classes

    abstract class ImageAutoGen extends EmbindClassHandle<ImageAutoGen> {
        // THIS IS A GENERATED CLASS. DO NOT EDIT DIRECTLY.

        /**
         * Load an analyze6 image.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static analyzeload(filename: string, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Join an array of images.
         * @param _in Array of input images.
         * @param options Optional options.
         * @return Output image.
         */
        static arrayjoin(_in: ArrayImage | ArrayConstant, options?: {
            /**
             * Number of images across grid.
             */
            across?: number
            /**
             * Pixels between images.
             */
            shim?: number
            /**
             * Colour for new pixels.
             */
            background?: ArrayConstant
            /**
             * Align on the left, centre or right.
             */
            halign?: Align | Enum
            /**
             * Align on the top, centre or bottom.
             */
            valign?: Align | Enum
            /**
             * Horizontal spacing between images.
             */
            hspacing?: number
            /**
             * Vertical spacing between images.
             */
            vspacing?: number
        }): Image;

        /**
         * Bandwise join a set of images.
         * @param _in Array of input images.
         * @return Output image.
         */
        static bandjoin(_in: ArrayImage | ArrayConstant): Image;

        /**
         * Band-wise rank of a set of images.
         * @param _in Array of input images.
         * @param options Optional options.
         * @return Output image.
         */
        static bandrank(_in: ArrayImage | ArrayConstant, options?: {
            /**
             * Select this band element from sorted list.
             */
            index?: number
        }): Image;

        /**
         * Make a black image.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static black(width: number, height: number, options?: {
            /**
             * Number of bands in image.
             */
            bands?: number
        }): Image;

        /**
         * Load csv.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static csvload(filename: string, options?: {
            /**
             * Skip this many lines at the start of the file.
             */
            skip?: number
            /**
             * Read this many lines from the file.
             */
            lines?: number
            /**
             * Set of whitespace characters.
             */
            whitespace?: string
            /**
             * Set of separator characters.
             */
            separator?: string
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load csv.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static csvloadSource(source: Source, options?: {
            /**
             * Skip this many lines at the start of the file.
             */
            skip?: number
            /**
             * Read this many lines from the file.
             */
            lines?: number
            /**
             * Set of whitespace characters.
             */
            whitespace?: string
            /**
             * Set of separator characters.
             */
            separator?: string
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Make an image showing the eye's spatial response.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static eye(width: number, height: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Maximum spatial frequency.
             */
            factor?: number
        }): Image;

        /**
         * Make a fractal surface.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param fractal_dimension Fractal dimension.
         * @return Output image.
         */
        static fractsurf(width: number, height: number, fractal_dimension: number): Image;

        /**
         * Make a gaussian image.
         * @param sigma Sigma of Gaussian.
         * @param min_ampl Minimum amplitude of Gaussian.
         * @param options Optional options.
         * @return Output image.
         */
        static gaussmat(sigma: number, min_ampl: number, options?: {
            /**
             * Generate separable gaussian.
             */
            separable?: boolean
            /**
             * Generate with this precision.
             */
            precision?: Precision | Enum
        }): Image;

        /**
         * Make a gaussnoise image.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static gaussnoise(width: number, height: number, options?: {
            /**
             * Standard deviation of pixels in generated image.
             */
            sigma?: number
            /**
             * Mean of pixels in generated image.
             */
            mean?: number
            /**
             * Random number seed.
             */
            seed?: number
        }): Image;

        /**
         * Load gif with libnsgif.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static gifload(filename: string, options?: {
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * First page to load.
             */
            page?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load gif with libnsgif.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static gifloadBuffer(buffer: Blob, options?: {
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * First page to load.
             */
            page?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load gif from source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static gifloadSource(source: Source, options?: {
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * First page to load.
             */
            page?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Make a grey ramp image.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static grey(width: number, height: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
        }): Image;

        /**
         * Load a heif image.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static heifload(filename: string, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Fetch thumbnail image.
             */
            thumbnail?: boolean
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load a heif image.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static heifloadBuffer(buffer: Blob, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Fetch thumbnail image.
             */
            thumbnail?: boolean
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load a heif image.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static heifloadSource(source: Source, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Fetch thumbnail image.
             */
            thumbnail?: boolean
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Make a 1d image where pixel values are indexes.
         * @param options Optional options.
         * @return Output image.
         */
        static identity(options?: {
            /**
             * Number of bands in lut.
             */
            bands?: number
            /**
             * Create a 16-bit lut.
             */
            ushort?: boolean
            /**
             * Size of 16-bit lut.
             */
            size?: number
        }): Image;

        /**
         * Load jpeg from file.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static jpegload(filename: string, options?: {
            /**
             * Shrink factor on load.
             */
            shrink?: number
            /**
             * Rotate image using exif orientation.
             */
            autorotate?: boolean
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load jpeg from buffer.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static jpegloadBuffer(buffer: Blob, options?: {
            /**
             * Shrink factor on load.
             */
            shrink?: number
            /**
             * Rotate image using exif orientation.
             */
            autorotate?: boolean
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load image from jpeg source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static jpegloadSource(source: Source, options?: {
            /**
             * Shrink factor on load.
             */
            shrink?: number
            /**
             * Rotate image using exif orientation.
             */
            autorotate?: boolean
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load jpeg-xl image.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static jxlload(filename: string, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load jpeg-xl image.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static jxlloadBuffer(buffer: Blob, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load jpeg-xl image.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static jxlloadSource(source: Source, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Make a laplacian of gaussian image.
         * @param sigma Radius of Gaussian.
         * @param min_ampl Minimum amplitude of Gaussian.
         * @param options Optional options.
         * @return Output image.
         */
        static logmat(sigma: number, min_ampl: number, options?: {
            /**
             * Generate separable gaussian.
             */
            separable?: boolean
            /**
             * Generate with this precision.
             */
            precision?: Precision | Enum
        }): Image;

        /**
         * Make a butterworth filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param order Filter order.
         * @param frequency_cutoff Frequency cutoff.
         * @param amplitude_cutoff Amplitude cutoff.
         * @param options Optional options.
         * @return Output image.
         */
        static maskButterworth(width: number, height: number, order: number, frequency_cutoff: number, amplitude_cutoff: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make a butterworth_band filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param order Filter order.
         * @param frequency_cutoff_x Frequency cutoff x.
         * @param frequency_cutoff_y Frequency cutoff y.
         * @param radius Radius of circle.
         * @param amplitude_cutoff Amplitude cutoff.
         * @param options Optional options.
         * @return Output image.
         */
        static maskButterworthBand(width: number, height: number, order: number, frequency_cutoff_x: number, frequency_cutoff_y: number, radius: number, amplitude_cutoff: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make a butterworth ring filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param order Filter order.
         * @param frequency_cutoff Frequency cutoff.
         * @param amplitude_cutoff Amplitude cutoff.
         * @param ringwidth Ringwidth.
         * @param options Optional options.
         * @return Output image.
         */
        static maskButterworthRing(width: number, height: number, order: number, frequency_cutoff: number, amplitude_cutoff: number, ringwidth: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make fractal filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param fractal_dimension Fractal dimension.
         * @param options Optional options.
         * @return Output image.
         */
        static maskFractal(width: number, height: number, fractal_dimension: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make a gaussian filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param frequency_cutoff Frequency cutoff.
         * @param amplitude_cutoff Amplitude cutoff.
         * @param options Optional options.
         * @return Output image.
         */
        static maskGaussian(width: number, height: number, frequency_cutoff: number, amplitude_cutoff: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make a gaussian filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param frequency_cutoff_x Frequency cutoff x.
         * @param frequency_cutoff_y Frequency cutoff y.
         * @param radius Radius of circle.
         * @param amplitude_cutoff Amplitude cutoff.
         * @param options Optional options.
         * @return Output image.
         */
        static maskGaussianBand(width: number, height: number, frequency_cutoff_x: number, frequency_cutoff_y: number, radius: number, amplitude_cutoff: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make a gaussian ring filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param frequency_cutoff Frequency cutoff.
         * @param amplitude_cutoff Amplitude cutoff.
         * @param ringwidth Ringwidth.
         * @param options Optional options.
         * @return Output image.
         */
        static maskGaussianRing(width: number, height: number, frequency_cutoff: number, amplitude_cutoff: number, ringwidth: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make an ideal filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param frequency_cutoff Frequency cutoff.
         * @param options Optional options.
         * @return Output image.
         */
        static maskIdeal(width: number, height: number, frequency_cutoff: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make an ideal band filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param frequency_cutoff_x Frequency cutoff x.
         * @param frequency_cutoff_y Frequency cutoff y.
         * @param radius Radius of circle.
         * @param options Optional options.
         * @return Output image.
         */
        static maskIdealBand(width: number, height: number, frequency_cutoff_x: number, frequency_cutoff_y: number, radius: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Make an ideal ring filter.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param frequency_cutoff Frequency cutoff.
         * @param ringwidth Ringwidth.
         * @param options Optional options.
         * @return Output image.
         */
        static maskIdealRing(width: number, height: number, frequency_cutoff: number, ringwidth: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Remove dc component.
             */
            nodc?: boolean
            /**
             * Invert the sense of the filter.
             */
            reject?: boolean
            /**
             * Rotate quadrants to optical space.
             */
            optical?: boolean
        }): Image;

        /**
         * Load matrix.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static matrixload(filename: string, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load matrix.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static matrixloadSource(source: Source, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Make a perlin noise image.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static perlin(width: number, height: number, options?: {
            /**
             * Size of perlin cells.
             */
            cell_size?: number
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Random number seed.
             */
            seed?: number
        }): Image;

        /**
         * Load png from file.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static pngload(filename: string, options?: {
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load png from buffer.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static pngloadBuffer(buffer: Blob, options?: {
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load png from source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static pngloadSource(source: Source, options?: {
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load ppm from file.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static ppmload(filename: string, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load ppm from buffer.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static ppmloadBuffer(buffer: Blob, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load ppm from source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static ppmloadSource(source: Source, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load named icc profile.
         * @param name Profile name.
         * @return Loaded profile.
         */
        static profileLoad(name: string): Uint8Array;

        /**
         * Load a radiance image from a file.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static radload(filename: string, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load rad from buffer.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static radloadBuffer(buffer: Blob, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load rad from source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static radloadSource(source: Source, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load raw data from a file.
         * @param filename Filename to load from.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param bands Number of bands in image.
         * @param options Optional options.
         * @return Output image.
         */
        static rawload(filename: string, width: number, height: number, bands: number, options?: {
            /**
             * Offset in bytes from start of file.
             */
            offset?: number
            /**
             * Pixel format in image.
             */
            format?: BandFormat | Enum
            /**
             * Pixel interpretation.
             */
            interpretation?: Interpretation | Enum
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Create an sdf image.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param shape SDF shape to create.
         * @param options Optional options.
         * @return Output image.
         */
        static sdf(width: number, height: number, shape: SdfShape | Enum, options?: {
            /**
             * Radius.
             */
            r?: number
            /**
             * Point a.
             */
            a?: ArrayConstant
            /**
             * Point b.
             */
            b?: ArrayConstant
            /**
             * Corner radii.
             */
            corners?: ArrayConstant
        }): Image;

        /**
         * Make a 2d sine wave.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static sines(width: number, height: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
            /**
             * Horizontal spatial frequency.
             */
            hfreq?: number
            /**
             * Vertical spatial frequency.
             */
            vfreq?: number
        }): Image;

        /**
         * Sum an array of images.
         * @param _in Array of input images.
         * @return Output image.
         */
        static sum(_in: ArrayImage | ArrayConstant): Image;

        /**
         * Load svg with rsvg.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static svgload(filename: string, options?: {
            /**
             * Render at this dpi.
             */
            dpi?: number
            /**
             * Scale output by this factor.
             */
            scale?: number
            /**
             * Allow svg of any size.
             */
            unlimited?: boolean
            /**
             * Custom css.
             */
            stylesheet?: string
            /**
             * Enable scrgb 128-bit output (32-bit per channel).
             */
            high_bitdepth?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load svg with rsvg.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static svgloadBuffer(buffer: Blob, options?: {
            /**
             * Render at this dpi.
             */
            dpi?: number
            /**
             * Scale output by this factor.
             */
            scale?: number
            /**
             * Allow svg of any size.
             */
            unlimited?: boolean
            /**
             * Custom css.
             */
            stylesheet?: string
            /**
             * Enable scrgb 128-bit output (32-bit per channel).
             */
            high_bitdepth?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Find the index of the first non-zero pixel in tests.
         * @param tests Table of images to test.
         * @return Output image.
         */
        static switch(tests: ArrayImage | ArrayConstant): Image;

        /**
         * Run an external command.
         * @param cmd_format Command to run.
         * @param options Optional options.
         */
        static system(cmd_format: string, options?: {
            /**
             * Array of input images.
             */
            _in?: ArrayImage | ArrayConstant
            /**
             * Format for input filename.
             */
            in_format?: string
            /**
             * Format for output filename.
             */
            out_format?: string
            /**
             * Cache this call.
             */
            cache?: boolean
            /**
             * Output image (output).
             */
            out?: Image | undefined
            /**
             * Command log (output).
             */
            log?: string | undefined
        }): void;

        /**
         * Generate thumbnail from file.
         * @param filename Filename to read from.
         * @param width Size to this width.
         * @param options Optional options.
         * @return Output image.
         */
        static thumbnail(filename: string, width: number, options?: {
            /**
             * Size to this height.
             */
            height?: number
            /**
             * Only upsize, only downsize, or both.
             */
            size?: Size | Enum
            /**
             * Don't use orientation tags to rotate image upright.
             */
            no_rotate?: boolean
            /**
             * Reduce to fill target rectangle, then crop.
             */
            crop?: Interesting | Enum
            /**
             * Reduce in linear light.
             */
            linear?: boolean
            /**
             * Fallback input profile.
             */
            input_profile?: string
            /**
             * Fallback output profile.
             */
            output_profile?: string
            /**
             * Rendering intent.
             */
            intent?: Intent | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
        }): Image;

        /**
         * Generate thumbnail from buffer.
         * @param buffer Buffer to load from.
         * @param width Size to this width.
         * @param options Optional options.
         * @return Output image.
         */
        static thumbnailBuffer(buffer: Blob, width: number, options?: {
            /**
             * Options that are passed on to the underlying loader.
             */
            option_string?: string
            /**
             * Size to this height.
             */
            height?: number
            /**
             * Only upsize, only downsize, or both.
             */
            size?: Size | Enum
            /**
             * Don't use orientation tags to rotate image upright.
             */
            no_rotate?: boolean
            /**
             * Reduce to fill target rectangle, then crop.
             */
            crop?: Interesting | Enum
            /**
             * Reduce in linear light.
             */
            linear?: boolean
            /**
             * Fallback input profile.
             */
            input_profile?: string
            /**
             * Fallback output profile.
             */
            output_profile?: string
            /**
             * Rendering intent.
             */
            intent?: Intent | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
        }): Image;

        /**
         * Generate thumbnail from source.
         * @param source Source to load from.
         * @param width Size to this width.
         * @param options Optional options.
         * @return Output image.
         */
        static thumbnailSource(source: Source, width: number, options?: {
            /**
             * Options that are passed on to the underlying loader.
             */
            option_string?: string
            /**
             * Size to this height.
             */
            height?: number
            /**
             * Only upsize, only downsize, or both.
             */
            size?: Size | Enum
            /**
             * Don't use orientation tags to rotate image upright.
             */
            no_rotate?: boolean
            /**
             * Reduce to fill target rectangle, then crop.
             */
            crop?: Interesting | Enum
            /**
             * Reduce in linear light.
             */
            linear?: boolean
            /**
             * Fallback input profile.
             */
            input_profile?: string
            /**
             * Fallback output profile.
             */
            output_profile?: string
            /**
             * Rendering intent.
             */
            intent?: Intent | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
        }): Image;

        /**
         * Load tiff from file.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static tiffload(filename: string, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Rotate image using orientation tag.
             */
            autorotate?: boolean
            /**
             * Subifd index.
             */
            subifd?: number
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load tiff from buffer.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static tiffloadBuffer(buffer: Blob, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Rotate image using orientation tag.
             */
            autorotate?: boolean
            /**
             * Subifd index.
             */
            subifd?: number
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load tiff from source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static tiffloadSource(source: Source, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Rotate image using orientation tag.
             */
            autorotate?: boolean
            /**
             * Subifd index.
             */
            subifd?: number
            /**
             * Remove all denial of service limits.
             */
            unlimited?: boolean
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Build a look-up table.
         * @param options Optional options.
         * @return Output image.
         */
        static tonelut(options?: {
            /**
             * Size of lut to build.
             */
            in_max?: number
            /**
             * Maximum value in output lut.
             */
            out_max?: number
            /**
             * Lowest value in output.
             */
            Lb?: number
            /**
             * Highest value in output.
             */
            Lw?: number
            /**
             * Position of shadow.
             */
            Ps?: number
            /**
             * Position of mid-tones.
             */
            Pm?: number
            /**
             * Position of highlights.
             */
            Ph?: number
            /**
             * Adjust shadows by this much.
             */
            S?: number
            /**
             * Adjust mid-tones by this much.
             */
            M?: number
            /**
             * Adjust highlights by this much.
             */
            H?: number
        }): Image;

        /**
         * Load a uhdr image.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static uhdrload(filename: string, options?: {
            /**
             * Shrink factor on load.
             */
            shrink?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load a uhdr image.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static uhdrloadBuffer(buffer: Blob, options?: {
            /**
             * Shrink factor on load.
             */
            shrink?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load a uhdr image.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static uhdrloadSource(source: Source, options?: {
            /**
             * Shrink factor on load.
             */
            shrink?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load vips from file.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static vipsload(filename: string, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load vips from source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static vipsloadSource(source: Source, options?: {
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load webp from file.
         * @param filename Filename to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static webpload(filename: string, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Factor to scale by.
             */
            scale?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Don't use a cached result for this operation.
             */
            revalidate?: boolean
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load webp from buffer.
         * @param buffer Buffer to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static webploadBuffer(buffer: Blob, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Factor to scale by.
             */
            scale?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Load webp from source.
         * @param source Source to load from.
         * @param options Optional options.
         * @return Output image.
         */
        static webploadSource(source: Source, options?: {
            /**
             * First page to load.
             */
            page?: number
            /**
             * Number of pages to load, -1 for all.
             */
            n?: number
            /**
             * Factor to scale by.
             */
            scale?: number
            /**
             * Force open via memory.
             */
            memory?: boolean
            /**
             * Required access pattern for this file.
             */
            access?: Access | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
            /**
             * Flags for this file (output).
             */
            flags?: number | undefined
        }): Image;

        /**
         * Make a worley noise image.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static worley(width: number, height: number, options?: {
            /**
             * Size of worley cells.
             */
            cell_size?: number
            /**
             * Random number seed.
             */
            seed?: number
        }): Image;

        /**
         * Make an image where pixel values are coordinates.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static xyz(width: number, height: number, options?: {
            /**
             * Size of third dimension.
             */
            csize?: number
            /**
             * Size of fourth dimension.
             */
            dsize?: number
            /**
             * Size of fifth dimension.
             */
            esize?: number
        }): Image;

        /**
         * Make a zone plate.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        static zone(width: number, height: number, options?: {
            /**
             * Output an unsigned char image.
             */
            uchar?: boolean
        }): Image;

        /**
         * Transform lch to cmc.
         * @return Output image.
         */
        CMC2LCh(): Image;

        /**
         * Transform cmyk to xyz.
         * @return Output image.
         */
        CMYK2XYZ(): Image;

        /**
         * Transform hsv to srgb.
         * @return Output image.
         */
        HSV2sRGB(): Image;

        /**
         * Transform lch to cmc.
         * @return Output image.
         */
        LCh2CMC(): Image;

        /**
         * Transform lch to lab.
         * @return Output image.
         */
        LCh2Lab(): Image;

        /**
         * Transform lab to lch.
         * @return Output image.
         */
        Lab2LCh(): Image;

        /**
         * Transform float lab to labq coding.
         * @return Output image.
         */
        Lab2LabQ(): Image;

        /**
         * Transform float lab to signed short.
         * @return Output image.
         */
        Lab2LabS(): Image;

        /**
         * Transform cielab to xyz.
         * @param options Optional options.
         * @return Output image.
         */
        Lab2XYZ(options?: {
            /**
             * Color temperature.
             */
            temp?: ArrayConstant
        }): Image;

        /**
         * Unpack a labq image to float lab.
         * @return Output image.
         */
        LabQ2Lab(): Image;

        /**
         * Unpack a labq image to short lab.
         * @return Output image.
         */
        LabQ2LabS(): Image;

        /**
         * Convert a labq image to srgb.
         * @return Output image.
         */
        LabQ2sRGB(): Image;

        /**
         * Transform signed short lab to float.
         * @return Output image.
         */
        LabS2Lab(): Image;

        /**
         * Transform short lab to labq coding.
         * @return Output image.
         */
        LabS2LabQ(): Image;

        /**
         * Transform oklab to oklch.
         * @return Output image.
         */
        Oklab2Oklch(): Image;

        /**
         * Transform oklab to xyz.
         * @return Output image.
         */
        Oklab2XYZ(): Image;

        /**
         * Transform oklch to oklab.
         * @return Output image.
         */
        Oklch2Oklab(): Image;

        /**
         * Transform xyz to cmyk.
         * @return Output image.
         */
        XYZ2CMYK(): Image;

        /**
         * Transform xyz to lab.
         * @param options Optional options.
         * @return Output image.
         */
        XYZ2Lab(options?: {
            /**
             * Colour temperature.
             */
            temp?: ArrayConstant
        }): Image;

        /**
         * Transform xyz to oklab.
         * @return Output image.
         */
        XYZ2Oklab(): Image;

        /**
         * Transform xyz to yxy.
         * @return Output image.
         */
        XYZ2Yxy(): Image;

        /**
         * Transform xyz to scrgb.
         * @return Output image.
         */
        XYZ2scRGB(): Image;

        /**
         * Transform yxy to xyz.
         * @return Output image.
         */
        Yxy2XYZ(): Image;

        /**
         * Absolute value of an image.
         * @return Output image.
         */
        abs(): Image;

        /**
         * Add two images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        add(right: Image | ArrayConstant): Image;

        /**
         * Append an alpha channel.
         * @return Output image.
         */
        addalpha(): Image;

        /**
         * Affine transform of an image.
         * @param matrix Transformation matrix.
         * @param options Optional options.
         * @return Output image.
         */
        affine(matrix: ArrayConstant, options?: {
            /**
             * Interpolate pixels with this.
             */
            interpolate?: Interpolate
            /**
             * Area of output to generate.
             */
            oarea?: ArrayConstant
            /**
             * Horizontal output displacement.
             */
            odx?: number
            /**
             * Vertical output displacement.
             */
            ody?: number
            /**
             * Horizontal input displacement.
             */
            idx?: number
            /**
             * Vertical input displacement.
             */
            idy?: number
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Images have premultiplied alpha.
             */
            premultiplied?: boolean
            /**
             * How to generate the extra pixels.
             */
            extend?: Extend | Enum
        }): Image;

        /**
         * Autorotate image by exif tag.
         * @param options Optional options.
         * @return Output image.
         */
        autorot(options?: {
            /**
             * Angle image was rotated by (output).
             */
            angle?: Angle | undefined
            /**
             * Whether the image was flipped or not (output).
             */
            flip?: boolean | undefined
        }): Image;

        /**
         * Find image average.
         * @return Output value.
         */
        avg(): number;

        /**
         * Boolean operation across image bands.
         * @param boolean Boolean to perform.
         * @return Output image.
         */
        bandbool(boolean: OperationBoolean | Enum): Image;

        /**
         * Fold up x axis into bands.
         * @param options Optional options.
         * @return Output image.
         */
        bandfold(options?: {
            /**
             * Fold by this factor.
             */
            factor?: number
        }): Image;

        /**
         * Band-wise average.
         * @return Output image.
         */
        bandmean(): Image;

        /**
         * Unfold image bands into x axis.
         * @param options Optional options.
         * @return Output image.
         */
        bandunfold(options?: {
            /**
             * Unfold by this factor.
             */
            factor?: number
        }): Image;

        /**
         * Boolean operation on two images.
         * @param right Right-hand image argument.
         * @param boolean Boolean to perform.
         * @return Output image.
         */
        boolean(right: Image | ArrayConstant, boolean: OperationBoolean | Enum): Image;

        /**
         * Build a look-up table.
         * @return Output image.
         */
        buildlut(): Image;

        /**
         * Byteswap an image.
         * @return Output image.
         */
        byteswap(): Image;

        /**
         * Canny edge detector.
         * @param options Optional options.
         * @return Output image.
         */
        canny(options?: {
            /**
             * Sigma of gaussian.
             */
            sigma?: number
            /**
             * Convolve with this precision.
             */
            precision?: Precision | Enum
        }): Image;

        /**
         * Use pixel values to pick cases from an array of images.
         * @param cases Array of case images.
         * @return Output image.
         */
        case(cases: ArrayImage | ArrayConstant): Image;

        /**
         * Cast an image.
         * @param format Format to cast to.
         * @param options Optional options.
         * @return Output image.
         */
        cast(format: BandFormat | Enum, options?: {
            /**
             * Shift integer values up and down.
             */
            shift?: boolean
        }): Image;

        /**
         * Clamp values of an image.
         * @param options Optional options.
         * @return Output image.
         */
        clamp(options?: {
            /**
             * Minimum value.
             */
            min?: number
            /**
             * Maximum value.
             */
            max?: number
        }): Image;

        /**
         * Convert to a new colorspace.
         * @param space Destination color space.
         * @param options Optional options.
         * @return Output image.
         */
        colourspace(space: Interpretation | Enum, options?: {
            /**
             * Source color space.
             */
            source_space?: Interpretation | Enum
        }): Image;

        /**
         * Convolve with rotating mask.
         * @param mask Input matrix image.
         * @param options Optional options.
         * @return Output image.
         */
        compass(mask: Image | ArrayConstant, options?: {
            /**
             * Rotate and convolve this many times.
             */
            times?: number
            /**
             * Rotate mask by this much between convolutions.
             */
            angle?: Angle45 | Enum
            /**
             * Combine convolution results like this.
             */
            combine?: Combine | Enum
            /**
             * Convolve with this precision.
             */
            precision?: Precision | Enum
            /**
             * Use this many layers in approximation.
             */
            layers?: number
            /**
             * Cluster lines closer than this in approximation.
             */
            cluster?: number
        }): Image;

        /**
         * Perform a complex operation on an image.
         * @param cmplx Complex to perform.
         * @return Output image.
         */
        complex(cmplx: OperationComplex | Enum): Image;

        /**
         * Complex binary operations on two images.
         * @param right Right-hand image argument.
         * @param cmplx Binary complex operation to perform.
         * @return Output image.
         */
        complex2(right: Image | ArrayConstant, cmplx: OperationComplex2 | Enum): Image;

        /**
         * Form a complex image from two real images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        complexform(right: Image | ArrayConstant): Image;

        /**
         * Get a component from a complex image.
         * @param get Complex to perform.
         * @return Output image.
         */
        complexget(get: OperationComplexget | Enum): Image;

        /**
         * Blend a pair of images with a blend mode.
         * @param overlay Overlay image.
         * @param mode VipsBlendMode to join with.
         * @param options Optional options.
         * @return Output image.
         */
        composite2(overlay: Image | ArrayConstant, mode: BlendMode | Enum, options?: {
            /**
             * X position of overlay.
             */
            x?: number
            /**
             * Y position of overlay.
             */
            y?: number
            /**
             * Composite images in this colour space.
             */
            compositing_space?: Interpretation | Enum
            /**
             * Images have premultiplied alpha.
             */
            premultiplied?: boolean
        }): Image;

        /**
         * Convolution operation.
         * @param mask Input matrix image.
         * @param options Optional options.
         * @return Output image.
         */
        conv(mask: Image | ArrayConstant, options?: {
            /**
             * Convolve with this precision.
             */
            precision?: Precision | Enum
            /**
             * Use this many layers in approximation.
             */
            layers?: number
            /**
             * Cluster lines closer than this in approximation.
             */
            cluster?: number
        }): Image;

        /**
         * Approximate integer convolution.
         * @param mask Input matrix image.
         * @param options Optional options.
         * @return Output image.
         */
        conva(mask: Image | ArrayConstant, options?: {
            /**
             * Use this many layers in approximation.
             */
            layers?: number
            /**
             * Cluster lines closer than this in approximation.
             */
            cluster?: number
        }): Image;

        /**
         * Approximate separable integer convolution.
         * @param mask Input matrix image.
         * @param options Optional options.
         * @return Output image.
         */
        convasep(mask: Image | ArrayConstant, options?: {
            /**
             * Use this many layers in approximation.
             */
            layers?: number
        }): Image;

        /**
         * Float convolution operation.
         * @param mask Input matrix image.
         * @return Output image.
         */
        convf(mask: Image | ArrayConstant): Image;

        /**
         * Int convolution operation.
         * @param mask Input matrix image.
         * @return Output image.
         */
        convi(mask: Image | ArrayConstant): Image;

        /**
         * Separable convolution operation.
         * @param mask Input matrix image.
         * @param options Optional options.
         * @return Output image.
         */
        convsep(mask: Image | ArrayConstant, options?: {
            /**
             * Convolve with this precision.
             */
            precision?: Precision | Enum
            /**
             * Use this many layers in approximation.
             */
            layers?: number
            /**
             * Cluster lines closer than this in approximation.
             */
            cluster?: number
        }): Image;

        /**
         * Copy an image.
         * @param options Optional options.
         * @return Output image.
         */
        copy(options?: {
            /**
             * Image width in pixels.
             */
            width?: number
            /**
             * Image height in pixels.
             */
            height?: number
            /**
             * Number of bands in image.
             */
            bands?: number
            /**
             * Pixel format in image.
             */
            format?: BandFormat | Enum
            /**
             * Pixel coding.
             */
            coding?: Coding | Enum
            /**
             * Pixel interpretation.
             */
            interpretation?: Interpretation | Enum
            /**
             * Horizontal resolution in pixels/mm.
             */
            xres?: number
            /**
             * Vertical resolution in pixels/mm.
             */
            yres?: number
            /**
             * Horizontal offset of origin.
             */
            xoffset?: number
            /**
             * Vertical offset of origin.
             */
            yoffset?: number
        }): Image;

        /**
         * Count lines in an image.
         * @param direction Countlines left-right or up-down.
         * @return Number of lines.
         */
        countlines(direction: Direction | Enum): number;

        /**
         * Extract an area from an image.
         * @param left Left edge of extract area.
         * @param top Top edge of extract area.
         * @param width Width of extract area.
         * @param height Height of extract area.
         * @return Output image.
         */
        crop(left: number, top: number, width: number, height: number): Image;

        /**
         * Save image to csv.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        csvsave(filename: string, options?: {
            /**
             * Separator characters.
             */
            separator?: string
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to csv.
         * @param target Target to save to.
         * @param options Optional options.
         */
        csvsaveTarget(target: Target, options?: {
            /**
             * Separator characters.
             */
            separator?: string
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Calculate de00.
         * @param right Right-hand input image.
         * @return Output image.
         */
        dE00(right: Image | ArrayConstant): Image;

        /**
         * Calculate de76.
         * @param right Right-hand input image.
         * @return Output image.
         */
        dE76(right: Image | ArrayConstant): Image;

        /**
         * Calculate decmc.
         * @param right Right-hand input image.
         * @return Output image.
         */
        dECMC(right: Image | ArrayConstant): Image;

        /**
         * Find image standard deviation.
         * @return Output value.
         */
        deviate(): number;

        /**
         * Divide two images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        divide(right: Image | ArrayConstant): Image;

        /**
         * Draw a circle on an image.
         * @param ink Color for pixels.
         * @param cx Centre of draw_circle.
         * @param cy Centre of draw_circle.
         * @param radius Radius in pixels.
         * @param options Optional options.
         */
        drawCircle(ink: ArrayConstant, cx: number, cy: number, radius: number, options?: {
            /**
             * Draw a solid object.
             */
            fill?: boolean
        }): void;

        /**
         * Flood-fill an area.
         * @param ink Color for pixels.
         * @param x DrawFlood start point.
         * @param y DrawFlood start point.
         * @param options Optional options.
         */
        drawFlood(ink: ArrayConstant, x: number, y: number, options?: {
            /**
             * Test pixels in this image.
             */
            test?: Image | ArrayConstant
            /**
             * Drawflood while equal to edge.
             */
            equal?: boolean
            /**
             * Left edge of modified area (output).
             */
            left?: number | undefined
            /**
             * Top edge of modified area (output).
             */
            top?: number | undefined
            /**
             * Width of modified area (output).
             */
            width?: number | undefined
            /**
             * Height of modified area (output).
             */
            height?: number | undefined
        }): void;

        /**
         * Paint an image into another image.
         * @param sub Sub-image to insert into main image.
         * @param x Draw image here.
         * @param y Draw image here.
         * @param options Optional options.
         */
        drawImage(sub: Image | ArrayConstant, x: number, y: number, options?: {
            /**
             * Combining mode.
             */
            mode?: CombineMode | Enum
        }): void;

        /**
         * Draw a line on an image.
         * @param ink Color for pixels.
         * @param x1 Start of draw_line.
         * @param y1 Start of draw_line.
         * @param x2 End of draw_line.
         * @param y2 End of draw_line.
         */
        drawLine(ink: ArrayConstant, x1: number, y1: number, x2: number, y2: number): void;

        /**
         * Draw a mask on an image.
         * @param ink Color for pixels.
         * @param mask Mask of pixels to draw.
         * @param x Draw mask here.
         * @param y Draw mask here.
         */
        drawMask(ink: ArrayConstant, mask: Image | ArrayConstant, x: number, y: number): void;

        /**
         * Paint a rectangle on an image.
         * @param ink Color for pixels.
         * @param left Rect to fill.
         * @param top Rect to fill.
         * @param width Rect to fill.
         * @param height Rect to fill.
         * @param options Optional options.
         */
        drawRect(ink: ArrayConstant, left: number, top: number, width: number, height: number, options?: {
            /**
             * Draw a solid object.
             */
            fill?: boolean
        }): void;

        /**
         * Blur a rectangle on an image.
         * @param left Rect to fill.
         * @param top Rect to fill.
         * @param width Rect to fill.
         * @param height Rect to fill.
         */
        drawSmudge(left: number, top: number, width: number, height: number): void;

        /**
         * Embed an image in a larger image.
         * @param x Left edge of input in output.
         * @param y Top edge of input in output.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        embed(x: number, y: number, width: number, height: number, options?: {
            /**
             * How to generate the extra pixels.
             */
            extend?: Extend | Enum
            /**
             * Color for background pixels.
             */
            background?: ArrayConstant
        }): Image;

        /**
         * Extract an area from an image.
         * @param left Left edge of extract area.
         * @param top Top edge of extract area.
         * @param width Width of extract area.
         * @param height Height of extract area.
         * @return Output image.
         */
        extractArea(left: number, top: number, width: number, height: number): Image;

        /**
         * Extract band from an image.
         * @param band Band to extract.
         * @param options Optional options.
         * @return Output image.
         */
        extractBand(band: number, options?: {
            /**
             * Number of bands to extract.
             */
            n?: number
        }): Image;

        /**
         * False-color an image.
         * @return Output image.
         */
        falsecolour(): Image;

        /**
         * Fast correlation.
         * @param ref Input reference image.
         * @return Output image.
         */
        fastcor(ref: Image | ArrayConstant): Image;

        /**
         * Fill image zeros with nearest non-zero pixel.
         * @param options Optional options.
         * @return Value of nearest non-zero pixel.
         */
        fillNearest(options?: {
            /**
             * Distance to nearest non-zero pixel (output).
             */
            distance?: Image | undefined
        }): Image;

        /**
         * Flatten alpha out of an image.
         * @param options Optional options.
         * @return Output image.
         */
        flatten(options?: {
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Maximum value of alpha channel.
             */
            max_alpha?: number
        }): Image;

        /**
         * Flip an image.
         * @param direction Direction to flip image.
         * @return Output image.
         */
        flip(direction: Direction | Enum): Image;

        /**
         * Transform float rgb to radiance coding.
         * @return Output image.
         */
        float2rad(): Image;

        /**
         * Frequency-domain filtering.
         * @param mask Input mask image.
         * @return Output image.
         */
        freqmult(mask: Image | ArrayConstant): Image;

        /**
         * Gamma an image.
         * @param options Optional options.
         * @return Output image.
         */
        gamma(options?: {
            /**
             * Gamma factor.
             */
            exponent?: number
        }): Image;

        /**
         * Gaussian blur.
         * @param sigma Sigma of Gaussian.
         * @param options Optional options.
         * @return Output image.
         */
        gaussblur(sigma: number, options?: {
            /**
             * Minimum amplitude of gaussian.
             */
            min_ampl?: number
            /**
             * Convolve with this precision.
             */
            precision?: Precision | Enum
        }): Image;

        /**
         * Read a point from an image.
         * @param x Point to read.
         * @param y Point to read.
         * @param options Optional options.
         * @return Array of output values.
         */
        getpoint(x: number, y: number, options?: {
            /**
             * Complex pixels should be unpacked.
             */
            unpack_complex?: boolean
        }): number[];

        /**
         * Save as gif.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        gifsave(filename: string, options?: {
            /**
             * Amount of dithering.
             */
            dither?: number
            /**
             * Quantisation effort.
             */
            effort?: number
            /**
             * Number of bits per pixel.
             */
            bitdepth?: number
            /**
             * Maximum inter-frame error for transparency.
             */
            interframe_maxerror?: number
            /**
             * Reuse palette from input.
             */
            reuse?: boolean
            /**
             * Maximum inter-palette error for palette reusage.
             */
            interpalette_maxerror?: number
            /**
             * Generate an interlaced (progressive) gif.
             */
            interlace?: boolean
            /**
             * Keep duplicate frames in the output instead of combining them.
             */
            keep_duplicate_frames?: boolean
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save as gif.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        gifsaveBuffer(options?: {
            /**
             * Amount of dithering.
             */
            dither?: number
            /**
             * Quantisation effort.
             */
            effort?: number
            /**
             * Number of bits per pixel.
             */
            bitdepth?: number
            /**
             * Maximum inter-frame error for transparency.
             */
            interframe_maxerror?: number
            /**
             * Reuse palette from input.
             */
            reuse?: boolean
            /**
             * Maximum inter-palette error for palette reusage.
             */
            interpalette_maxerror?: number
            /**
             * Generate an interlaced (progressive) gif.
             */
            interlace?: boolean
            /**
             * Keep duplicate frames in the output instead of combining them.
             */
            keep_duplicate_frames?: boolean
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save as gif.
         * @param target Target to save to.
         * @param options Optional options.
         */
        gifsaveTarget(target: Target, options?: {
            /**
             * Amount of dithering.
             */
            dither?: number
            /**
             * Quantisation effort.
             */
            effort?: number
            /**
             * Number of bits per pixel.
             */
            bitdepth?: number
            /**
             * Maximum inter-frame error for transparency.
             */
            interframe_maxerror?: number
            /**
             * Reuse palette from input.
             */
            reuse?: boolean
            /**
             * Maximum inter-palette error for palette reusage.
             */
            interpalette_maxerror?: number
            /**
             * Generate an interlaced (progressive) gif.
             */
            interlace?: boolean
            /**
             * Keep duplicate frames in the output instead of combining them.
             */
            keep_duplicate_frames?: boolean
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Global balance an image mosaic.
         * @param options Optional options.
         * @return Output image.
         */
        globalbalance(options?: {
            /**
             * Image gamma.
             */
            gamma?: number
            /**
             * Integer output.
             */
            int_output?: boolean
        }): Image;

        /**
         * Place an image within a larger image with a certain gravity.
         * @param direction Direction to place image within width/height.
         * @param width Image width in pixels.
         * @param height Image height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        gravity(direction: CompassDirection | Enum, width: number, height: number, options?: {
            /**
             * How to generate the extra pixels.
             */
            extend?: Extend | Enum
            /**
             * Color for background pixels.
             */
            background?: ArrayConstant
        }): Image;

        /**
         * Grid an image.
         * @param tile_height Chop into tiles this high.
         * @param across Number of tiles across.
         * @param down Number of tiles down.
         * @return Output image.
         */
        grid(tile_height: number, across: number, down: number): Image;

        /**
         * Save image in heif format.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        heifsave(filename: string, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Number of bits per pixel.
             */
            bitdepth?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Compression format.
             */
            compression?: ForeignHeifCompression | Enum
            /**
             * Cpu effort.
             */
            effort?: number
            /**
             * Select chroma subsample operation mode.
             */
            subsample_mode?: ForeignSubsample | Enum
            /**
             * Select encoder to use.
             */
            encoder?: ForeignHeifEncoder | Enum
            /**
             * Tuning parameters.
             */
            tune?: string
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image in heif format.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        heifsaveBuffer(options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Number of bits per pixel.
             */
            bitdepth?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Compression format.
             */
            compression?: ForeignHeifCompression | Enum
            /**
             * Cpu effort.
             */
            effort?: number
            /**
             * Select chroma subsample operation mode.
             */
            subsample_mode?: ForeignSubsample | Enum
            /**
             * Select encoder to use.
             */
            encoder?: ForeignHeifEncoder | Enum
            /**
             * Tuning parameters.
             */
            tune?: string
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image in heif format.
         * @param target Target to save to.
         * @param options Optional options.
         */
        heifsaveTarget(target: Target, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Number of bits per pixel.
             */
            bitdepth?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Compression format.
             */
            compression?: ForeignHeifCompression | Enum
            /**
             * Cpu effort.
             */
            effort?: number
            /**
             * Select chroma subsample operation mode.
             */
            subsample_mode?: ForeignSubsample | Enum
            /**
             * Select encoder to use.
             */
            encoder?: ForeignHeifEncoder | Enum
            /**
             * Tuning parameters.
             */
            tune?: string
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Form cumulative histogram.
         * @return Output image.
         */
        histCum(): Image;

        /**
         * Estimate image entropy.
         * @return Output value.
         */
        histEntropy(): number;

        /**
         * Histogram equalisation.
         * @param options Optional options.
         * @return Output image.
         */
        histEqual(options?: {
            /**
             * Equalise with this band.
             */
            band?: number
        }): Image;

        /**
         * Find image histogram.
         * @param options Optional options.
         * @return Output histogram.
         */
        histFind(options?: {
            /**
             * Find histogram of band.
             */
            band?: number
        }): Image;

        /**
         * Find indexed image histogram.
         * @param index Index image.
         * @param options Optional options.
         * @return Output histogram.
         */
        histFindIndexed(index: Image | ArrayConstant, options?: {
            /**
             * Combine bins like this.
             */
            combine?: Combine | Enum
        }): Image;

        /**
         * Find n-dimensional image histogram.
         * @param options Optional options.
         * @return Output histogram.
         */
        histFindNdim(options?: {
            /**
             * Number of bins in each dimension.
             */
            bins?: number
        }): Image;

        /**
         * Test for monotonicity.
         * @return true if in is monotonic.
         */
        histIsmonotonic(): boolean;

        /**
         * Local histogram equalisation.
         * @param width Window width in pixels.
         * @param height Window height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        histLocal(width: number, height: number, options?: {
            /**
             * Maximum slope (clahe).
             */
            max_slope?: number
        }): Image;

        /**
         * Match two histograms.
         * @param ref Reference histogram.
         * @return Output image.
         */
        histMatch(ref: Image | ArrayConstant): Image;

        /**
         * Normalise histogram.
         * @return Output image.
         */
        histNorm(): Image;

        /**
         * Plot histogram.
         * @return Output image.
         */
        histPlot(): Image;

        /**
         * Find hough circle transform.
         * @param options Optional options.
         * @return Output image.
         */
        houghCircle(options?: {
            /**
             * Scale down dimensions by this factor.
             */
            scale?: number
            /**
             * Smallest radius to search for.
             */
            min_radius?: number
            /**
             * Largest radius to search for.
             */
            max_radius?: number
        }): Image;

        /**
         * Find hough line transform.
         * @param options Optional options.
         * @return Output image.
         */
        houghLine(options?: {
            /**
             * Horizontal size of parameter space.
             */
            width?: number
            /**
             * Vertical size of parameter space.
             */
            height?: number
        }): Image;

        /**
         * Output to device with icc profile.
         * @param options Optional options.
         * @return Output image.
         */
        iccExport(options?: {
            /**
             * Set profile connection space.
             */
            pcs?: PCS | Enum
            /**
             * Rendering intent.
             */
            intent?: Intent | Enum
            /**
             * Enable black point compensation.
             */
            black_point_compensation?: boolean
            /**
             * Filename to load output profile from.
             */
            output_profile?: string
            /**
             * Output device space depth in bits.
             */
            depth?: number
        }): Image;

        /**
         * Import from device with icc profile.
         * @param options Optional options.
         * @return Output image.
         */
        iccImport(options?: {
            /**
             * Set profile connection space.
             */
            pcs?: PCS | Enum
            /**
             * Rendering intent.
             */
            intent?: Intent | Enum
            /**
             * Enable black point compensation.
             */
            black_point_compensation?: boolean
            /**
             * Use embedded input profile, if available.
             */
            embedded?: boolean
            /**
             * Filename to load input profile from.
             */
            input_profile?: string
        }): Image;

        /**
         * Transform between devices with icc profiles.
         * @param output_profile Filename to load output profile from.
         * @param options Optional options.
         * @return Output image.
         */
        iccTransform(output_profile: string, options?: {
            /**
             * Set profile connection space.
             */
            pcs?: PCS | Enum
            /**
             * Rendering intent.
             */
            intent?: Intent | Enum
            /**
             * Enable black point compensation.
             */
            black_point_compensation?: boolean
            /**
             * Use embedded input profile, if available.
             */
            embedded?: boolean
            /**
             * Filename to load input profile from.
             */
            input_profile?: string
            /**
             * Output device space depth in bits.
             */
            depth?: number
        }): Image;

        /**
         * Ifthenelse an image.
         * @param in1 Source for TRUE pixels.
         * @param in2 Source for FALSE pixels.
         * @param options Optional options.
         * @return Output image.
         */
        ifthenelse(in1: Image | ArrayConstant, in2: Image | ArrayConstant, options?: {
            /**
             * Blend smoothly between then and else parts.
             */
            blend?: boolean
        }): Image;

        /**
         * Insert image @sub into @main at @x, @y.
         * @param sub Sub-image to insert into main image.
         * @param x Left edge of sub in main.
         * @param y Top edge of sub in main.
         * @param options Optional options.
         * @return Output image.
         */
        insert(sub: Image | ArrayConstant, x: number, y: number, options?: {
            /**
             * Expand output to hold all of both inputs.
             */
            expand?: boolean
            /**
             * Color for new pixels.
             */
            background?: ArrayConstant
        }): Image;

        /**
         * Invert an image.
         * @return Output image.
         */
        invert(): Image;

        /**
         * Build an inverted look-up table.
         * @param options Optional options.
         * @return Output image.
         */
        invertlut(options?: {
            /**
             * Lut size to generate.
             */
            size?: number
        }): Image;

        /**
         * Join a pair of images.
         * @param in2 Second input image.
         * @param direction Join left-right or up-down.
         * @param options Optional options.
         * @return Output image.
         */
        join(in2: Image | ArrayConstant, direction: Direction | Enum, options?: {
            /**
             * Expand output to hold all of both inputs.
             */
            expand?: boolean
            /**
             * Pixels between images.
             */
            shim?: number
            /**
             * Colour for new pixels.
             */
            background?: ArrayConstant
            /**
             * Align on the low, centre or high coordinate edge.
             */
            align?: Align | Enum
        }): Image;

        /**
         * Save as jpeg.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        jpegsave(filename: string, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Compute optimal huffman coding tables.
             */
            optimize_coding?: boolean
            /**
             * Generate an interlaced (progressive) jpeg.
             */
            interlace?: boolean
            /**
             * Apply trellis quantisation to each 8x8 block.
             */
            trellis_quant?: boolean
            /**
             * Apply overshooting to samples with extreme values.
             */
            overshoot_deringing?: boolean
            /**
             * Split spectrum of dct coefficients into separate scans.
             */
            optimize_scans?: boolean
            /**
             * Use predefined quantization table with given index.
             */
            quant_table?: number
            /**
             * Select chroma subsample operation mode.
             */
            subsample_mode?: ForeignSubsample | Enum
            /**
             * Add restart markers every specified number of mcu.
             */
            restart_interval?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save as jpeg.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        jpegsaveBuffer(options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Compute optimal huffman coding tables.
             */
            optimize_coding?: boolean
            /**
             * Generate an interlaced (progressive) jpeg.
             */
            interlace?: boolean
            /**
             * Apply trellis quantisation to each 8x8 block.
             */
            trellis_quant?: boolean
            /**
             * Apply overshooting to samples with extreme values.
             */
            overshoot_deringing?: boolean
            /**
             * Split spectrum of dct coefficients into separate scans.
             */
            optimize_scans?: boolean
            /**
             * Use predefined quantization table with given index.
             */
            quant_table?: number
            /**
             * Select chroma subsample operation mode.
             */
            subsample_mode?: ForeignSubsample | Enum
            /**
             * Add restart markers every specified number of mcu.
             */
            restart_interval?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image to jpeg mime.
         * @param options Optional options.
         */
        jpegsaveMime(options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Compute optimal huffman coding tables.
             */
            optimize_coding?: boolean
            /**
             * Generate an interlaced (progressive) jpeg.
             */
            interlace?: boolean
            /**
             * Apply trellis quantisation to each 8x8 block.
             */
            trellis_quant?: boolean
            /**
             * Apply overshooting to samples with extreme values.
             */
            overshoot_deringing?: boolean
            /**
             * Split spectrum of dct coefficients into separate scans.
             */
            optimize_scans?: boolean
            /**
             * Use predefined quantization table with given index.
             */
            quant_table?: number
            /**
             * Select chroma subsample operation mode.
             */
            subsample_mode?: ForeignSubsample | Enum
            /**
             * Add restart markers every specified number of mcu.
             */
            restart_interval?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save as jpeg.
         * @param target Target to save to.
         * @param options Optional options.
         */
        jpegsaveTarget(target: Target, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Compute optimal huffman coding tables.
             */
            optimize_coding?: boolean
            /**
             * Generate an interlaced (progressive) jpeg.
             */
            interlace?: boolean
            /**
             * Apply trellis quantisation to each 8x8 block.
             */
            trellis_quant?: boolean
            /**
             * Apply overshooting to samples with extreme values.
             */
            overshoot_deringing?: boolean
            /**
             * Split spectrum of dct coefficients into separate scans.
             */
            optimize_scans?: boolean
            /**
             * Use predefined quantization table with given index.
             */
            quant_table?: number
            /**
             * Select chroma subsample operation mode.
             */
            subsample_mode?: ForeignSubsample | Enum
            /**
             * Add restart markers every specified number of mcu.
             */
            restart_interval?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image in jpeg-xl format.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        jxlsave(filename: string, options?: {
            /**
             * Decode speed tier.
             */
            tier?: number
            /**
             * Target butteraugli distance.
             */
            distance?: number
            /**
             * Encoding effort.
             */
            effort?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Quality factor.
             */
            Q?: number
            /**
             * Bit depth.
             */
            bitdepth?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image in jpeg-xl format.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        jxlsaveBuffer(options?: {
            /**
             * Decode speed tier.
             */
            tier?: number
            /**
             * Target butteraugli distance.
             */
            distance?: number
            /**
             * Encoding effort.
             */
            effort?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Quality factor.
             */
            Q?: number
            /**
             * Bit depth.
             */
            bitdepth?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image in jpeg-xl format.
         * @param target Target to save to.
         * @param options Optional options.
         */
        jxlsaveTarget(target: Target, options?: {
            /**
             * Decode speed tier.
             */
            tier?: number
            /**
             * Target butteraugli distance.
             */
            distance?: number
            /**
             * Encoding effort.
             */
            effort?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Quality factor.
             */
            Q?: number
            /**
             * Bit depth.
             */
            bitdepth?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Label regions in an image.
         * @param options Optional options.
         * @return Mask of region labels.
         */
        labelregions(options?: {
            /**
             * Number of discrete contiguous regions (output).
             */
            segments?: number | undefined
        }): Image;

        /**
         * Calculate (a * in + b).
         * @param a Multiply by this.
         * @param b Add this.
         * @param options Optional options.
         * @return Output image.
         */
        linear(a: ArrayConstant, b: ArrayConstant, options?: {
            /**
             * Output should be uchar.
             */
            uchar?: boolean
        }): Image;

        /**
         * Cache an image as a set of lines.
         * @param options Optional options.
         * @return Output image.
         */
        linecache(options?: {
            /**
             * Tile height in pixels.
             */
            tile_height?: number
            /**
             * Expected access pattern.
             */
            access?: Access | Enum
            /**
             * Allow threaded access.
             */
            threaded?: boolean
            /**
             * Keep cache between evaluations.
             */
            persistent?: boolean
        }): Image;

        /**
         * Resample with a map image.
         * @param index Index pixels with this.
         * @param options Optional options.
         * @return Output image.
         */
        mapim(index: Image | ArrayConstant, options?: {
            /**
             * Interpolate pixels with this.
             */
            interpolate?: Interpolate
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Images have premultiplied alpha.
             */
            premultiplied?: boolean
            /**
             * How to generate the extra pixels.
             */
            extend?: Extend | Enum
        }): Image;

        /**
         * Map an image though a lut.
         * @param lut Look-up table image.
         * @param options Optional options.
         * @return Output image.
         */
        maplut(lut: Image | ArrayConstant, options?: {
            /**
             * Apply one-band lut to this band of in.
             */
            band?: number
        }): Image;

        /**
         * First-order match of two images.
         * @param sec Secondary image.
         * @param xr1 Position of first reference tie-point.
         * @param yr1 Position of first reference tie-point.
         * @param xs1 Position of first secondary tie-point.
         * @param ys1 Position of first secondary tie-point.
         * @param xr2 Position of second reference tie-point.
         * @param yr2 Position of second reference tie-point.
         * @param xs2 Position of second secondary tie-point.
         * @param ys2 Position of second secondary tie-point.
         * @param options Optional options.
         * @return Output image.
         */
        match(sec: Image | ArrayConstant, xr1: number, yr1: number, xs1: number, ys1: number, xr2: number, yr2: number, xs2: number, ys2: number, options?: {
            /**
             * Half window size.
             */
            hwindow?: number
            /**
             * Half area size.
             */
            harea?: number
            /**
             * Search to improve tie-points.
             */
            search?: boolean
            /**
             * Interpolate pixels with this.
             */
            interpolate?: Interpolate
        }): Image;

        /**
         * Apply a math operation to an image.
         * @param math Math to perform.
         * @return Output image.
         */
        math(math: OperationMath | Enum): Image;

        /**
         * Binary math operations.
         * @param right Right-hand image argument.
         * @param math2 Math to perform.
         * @return Output image.
         */
        math2(right: Image | ArrayConstant, math2: OperationMath2 | Enum): Image;

        /**
         * Invert a matrix.
         * @return Output matrix.
         */
        matrixinvert(): Image;

        /**
         * Multiply two matrices.
         * @param right Second matrix to multiply.
         * @return Output matrix.
         */
        matrixmultiply(right: Image | ArrayConstant): Image;

        /**
         * Print matrix.
         * @param options Optional options.
         */
        matrixprint(options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to matrix.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        matrixsave(filename: string, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to matrix.
         * @param target Target to save to.
         * @param options Optional options.
         */
        matrixsaveTarget(target: Target, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Find image maximum.
         * @param options Optional options.
         * @return Output value.
         */
        max(options?: {
            /**
             * Number of maximum values to find.
             */
            size?: number
            /**
             * Horizontal position of maximum (output).
             */
            x?: number | undefined
            /**
             * Vertical position of maximum (output).
             */
            y?: number | undefined
            /**
             * Array of output values (output).
             */
            out_array?: number[] | undefined
            /**
             * Array of horizontal positions (output).
             */
            x_array?: number[] | undefined
            /**
             * Array of vertical positions (output).
             */
            y_array?: number[] | undefined
        }): number;

        /**
         * Maximum of a pair of images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        maxpair(right: Image | ArrayConstant): Image;

        /**
         * Measure a set of patches on a color chart.
         * @param h Number of patches across chart.
         * @param v Number of patches down chart.
         * @param options Optional options.
         * @return Output array of statistics.
         */
        measure(h: number, v: number, options?: {
            /**
             * Left edge of extract area.
             */
            left?: number
            /**
             * Top edge of extract area.
             */
            top?: number
            /**
             * Width of extract area.
             */
            width?: number
            /**
             * Height of extract area.
             */
            height?: number
        }): Image;

        /**
         * Merge two images.
         * @param sec Secondary image.
         * @param direction Horizontal or vertical merge.
         * @param dx Horizontal displacement from sec to ref.
         * @param dy Vertical displacement from sec to ref.
         * @param options Optional options.
         * @return Output image.
         */
        merge(sec: Image | ArrayConstant, direction: Direction | Enum, dx: number, dy: number, options?: {
            /**
             * Maximum blend size.
             */
            mblend?: number
        }): Image;

        /**
         * Find image minimum.
         * @param options Optional options.
         * @return Output value.
         */
        min(options?: {
            /**
             * Number of minimum values to find.
             */
            size?: number
            /**
             * Horizontal position of minimum (output).
             */
            x?: number | undefined
            /**
             * Vertical position of minimum (output).
             */
            y?: number | undefined
            /**
             * Array of output values (output).
             */
            out_array?: number[] | undefined
            /**
             * Array of horizontal positions (output).
             */
            x_array?: number[] | undefined
            /**
             * Array of vertical positions (output).
             */
            y_array?: number[] | undefined
        }): number;

        /**
         * Minimum of a pair of images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        minpair(right: Image | ArrayConstant): Image;

        /**
         * Morphology operation.
         * @param mask Input matrix image.
         * @param morph Morphological operation to perform.
         * @return Output image.
         */
        morph(mask: Image | ArrayConstant, morph: OperationMorphology | Enum): Image;

        /**
         * Mosaic two images.
         * @param sec Secondary image.
         * @param direction Horizontal or vertical mosaic.
         * @param xref Position of reference tie-point.
         * @param yref Position of reference tie-point.
         * @param xsec Position of secondary tie-point.
         * @param ysec Position of secondary tie-point.
         * @param options Optional options.
         * @return Output image.
         */
        mosaic(sec: Image | ArrayConstant, direction: Direction | Enum, xref: number, yref: number, xsec: number, ysec: number, options?: {
            /**
             * Half window size.
             */
            hwindow?: number
            /**
             * Half area size.
             */
            harea?: number
            /**
             * Maximum blend size.
             */
            mblend?: number
            /**
             * Band to search for features on.
             */
            bandno?: number
            /**
             * Detected integer offset (output).
             */
            dx0?: number | undefined
            /**
             * Detected integer offset (output).
             */
            dy0?: number | undefined
            /**
             * Detected scale (output).
             */
            scale1?: number | undefined
            /**
             * Detected rotation (output).
             */
            angle1?: number | undefined
            /**
             * Detected first-order displacement (output).
             */
            dy1?: number | undefined
            /**
             * Detected first-order displacement (output).
             */
            dx1?: number | undefined
        }): Image;

        /**
         * First-order mosaic of two images.
         * @param sec Secondary image.
         * @param direction Horizontal or vertical mosaic.
         * @param xr1 Position of first reference tie-point.
         * @param yr1 Position of first reference tie-point.
         * @param xs1 Position of first secondary tie-point.
         * @param ys1 Position of first secondary tie-point.
         * @param xr2 Position of second reference tie-point.
         * @param yr2 Position of second reference tie-point.
         * @param xs2 Position of second secondary tie-point.
         * @param ys2 Position of second secondary tie-point.
         * @param options Optional options.
         * @return Output image.
         */
        mosaic1(sec: Image | ArrayConstant, direction: Direction | Enum, xr1: number, yr1: number, xs1: number, ys1: number, xr2: number, yr2: number, xs2: number, ys2: number, options?: {
            /**
             * Half window size.
             */
            hwindow?: number
            /**
             * Half area size.
             */
            harea?: number
            /**
             * Search to improve tie-points.
             */
            search?: boolean
            /**
             * Interpolate pixels with this.
             */
            interpolate?: Interpolate
            /**
             * Maximum blend size.
             */
            mblend?: number
        }): Image;

        /**
         * Pick most-significant byte from an image.
         * @param options Optional options.
         * @return Output image.
         */
        msb(options?: {
            /**
             * Band to msb.
             */
            band?: number
        }): Image;

        /**
         * Multiply two images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        multiply(right: Image | ArrayConstant): Image;

        /**
         * Find threshold for percent of pixels.
         * @param percent Percent of pixels.
         * @return Threshold above which lie percent of pixels.
         */
        percent(percent: number): number;

        /**
         * Calculate phase correlation.
         * @param in2 Second input image.
         * @return Output image.
         */
        phasecor(in2: Image | ArrayConstant): Image;

        /**
         * Save image to file as png.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        pngsave(filename: string, options?: {
            /**
             * Compression factor.
             */
            compression?: number
            /**
             * Interlace image.
             */
            interlace?: boolean
            /**
             * Libpng row filter flag(s).
             */
            filter?: ForeignPngFilter | Flag
            /**
             * Quantise to 8bpp palette.
             */
            palette?: boolean
            /**
             * Quantisation quality.
             */
            Q?: number
            /**
             * Amount of dithering.
             */
            dither?: number
            /**
             * Write as a 1, 2, 4, 8 or 16 bit image.
             */
            bitdepth?: number
            /**
             * Quantisation cpu effort.
             */
            effort?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to buffer as png.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        pngsaveBuffer(options?: {
            /**
             * Compression factor.
             */
            compression?: number
            /**
             * Interlace image.
             */
            interlace?: boolean
            /**
             * Libpng row filter flag(s).
             */
            filter?: ForeignPngFilter | Flag
            /**
             * Quantise to 8bpp palette.
             */
            palette?: boolean
            /**
             * Quantisation quality.
             */
            Q?: number
            /**
             * Amount of dithering.
             */
            dither?: number
            /**
             * Write as a 1, 2, 4, 8 or 16 bit image.
             */
            bitdepth?: number
            /**
             * Quantisation cpu effort.
             */
            effort?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image to target as png.
         * @param target Target to save to.
         * @param options Optional options.
         */
        pngsaveTarget(target: Target, options?: {
            /**
             * Compression factor.
             */
            compression?: number
            /**
             * Interlace image.
             */
            interlace?: boolean
            /**
             * Libpng row filter flag(s).
             */
            filter?: ForeignPngFilter | Flag
            /**
             * Quantise to 8bpp palette.
             */
            palette?: boolean
            /**
             * Quantisation quality.
             */
            Q?: number
            /**
             * Amount of dithering.
             */
            dither?: number
            /**
             * Write as a 1, 2, 4, 8 or 16 bit image.
             */
            bitdepth?: number
            /**
             * Quantisation cpu effort.
             */
            effort?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to ppm file.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        ppmsave(filename: string, options?: {
            /**
             * Format to save in.
             */
            format?: ForeignPpmFormat | Enum
            /**
             * Save as ascii.
             */
            ascii?: boolean
            /**
             * Set to 1 to write as a 1 bit image.
             */
            bitdepth?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save to ppm.
         * @param target Target to save to.
         * @param options Optional options.
         */
        ppmsaveTarget(target: Target, options?: {
            /**
             * Format to save in.
             */
            format?: ForeignPpmFormat | Enum
            /**
             * Save as ascii.
             */
            ascii?: boolean
            /**
             * Set to 1 to write as a 1 bit image.
             */
            bitdepth?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Premultiply image alpha.
         * @param options Optional options.
         * @return Output image.
         */
        premultiply(options?: {
            /**
             * Maximum value of alpha channel.
             */
            max_alpha?: number
        }): Image;

        /**
         * Prewitt edge detector.
         * @return Output image.
         */
        prewitt(): Image;

        /**
         * Resample an image with a quadratic transform.
         * @param coeff Coefficient matrix.
         * @param options Optional options.
         * @return Output image.
         */
        quadratic(coeff: Image | ArrayConstant, options?: {
            /**
             * Interpolate values with this.
             */
            interpolate?: Interpolate
        }): Image;

        /**
         * Unpack radiance coding to float rgb.
         * @return Output image.
         */
        rad2float(): Image;

        /**
         * Save image to radiance file.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        radsave(filename: string, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to radiance buffer.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        radsaveBuffer(options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image to radiance target.
         * @param target Target to save to.
         * @param options Optional options.
         */
        radsaveTarget(target: Target, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Rank filter.
         * @param width Window width in pixels.
         * @param height Window height in pixels.
         * @param index Select pixel at index.
         * @return Output image.
         */
        rank(width: number, height: number, index: number): Image;

        /**
         * Save image to raw file.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        rawsave(filename: string, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Write raw image to buffer.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        rawsaveBuffer(options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Write raw image to target.
         * @param target Target to save to.
         * @param options Optional options.
         */
        rawsaveTarget(target: Target, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Linear recombination with matrix.
         * @param m Matrix of coefficients.
         * @return Output image.
         */
        recomb(m: Image | ArrayConstant): Image;

        /**
         * Reduce an image.
         * @param hshrink Horizontal shrink factor.
         * @param vshrink Vertical shrink factor.
         * @param options Optional options.
         * @return Output image.
         */
        reduce(hshrink: number, vshrink: number, options?: {
            /**
             * Resampling kernel.
             */
            kernel?: Kernel | Enum
            /**
             * Reducing gap.
             */
            gap?: number
        }): Image;

        /**
         * Shrink an image horizontally.
         * @param hshrink Horizontal shrink factor.
         * @param options Optional options.
         * @return Output image.
         */
        reduceh(hshrink: number, options?: {
            /**
             * Resampling kernel.
             */
            kernel?: Kernel | Enum
            /**
             * Reducing gap.
             */
            gap?: number
        }): Image;

        /**
         * Shrink an image vertically.
         * @param vshrink Vertical shrink factor.
         * @param options Optional options.
         * @return Output image.
         */
        reducev(vshrink: number, options?: {
            /**
             * Resampling kernel.
             */
            kernel?: Kernel | Enum
            /**
             * Reducing gap.
             */
            gap?: number
        }): Image;

        /**
         * Relational operation on two images.
         * @param right Right-hand image argument.
         * @param relational Relational to perform.
         * @return Output image.
         */
        relational(right: Image | ArrayConstant, relational: OperationRelational | Enum): Image;

        /**
         * Remainder after integer division of two images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        remainder(right: Image | ArrayConstant): Image;

        /**
         * Rebuild an mosaiced image.
         * @param old_str Search for this string.
         * @param new_str And swap for this string.
         * @return Output image.
         */
        remosaic(old_str: string, new_str: string): Image;

        /**
         * Replicate an image.
         * @param across Repeat this many times horizontally.
         * @param down Repeat this many times vertically.
         * @return Output image.
         */
        replicate(across: number, down: number): Image;

        /**
         * Resize an image.
         * @param scale Scale image by this factor.
         * @param options Optional options.
         * @return Output image.
         */
        resize(scale: number, options?: {
            /**
             * Resampling kernel.
             */
            kernel?: Kernel | Enum
            /**
             * Reducing gap.
             */
            gap?: number
            /**
             * Vertical scale image by this factor.
             */
            vscale?: number
        }): Image;

        /**
         * Rotate an image.
         * @param angle Angle to rotate image.
         * @return Output image.
         */
        rot(angle: Angle | Enum): Image;

        /**
         * Rotate an image.
         * @param options Optional options.
         * @return Output image.
         */
        rot45(options?: {
            /**
             * Angle to rotate image.
             */
            angle?: Angle45 | Enum
        }): Image;

        /**
         * Rotate an image by a number of degrees.
         * @param angle Rotate clockwise by this many degrees.
         * @param options Optional options.
         * @return Output image.
         */
        rotate(angle: number, options?: {
            /**
             * Interpolate pixels with this.
             */
            interpolate?: Interpolate
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Horizontal output displacement.
             */
            odx?: number
            /**
             * Vertical output displacement.
             */
            ody?: number
            /**
             * Horizontal input displacement.
             */
            idx?: number
            /**
             * Vertical input displacement.
             */
            idy?: number
        }): Image;

        /**
         * Perform a round function on an image.
         * @param round Rounding operation to perform.
         * @return Output image.
         */
        round(round: OperationRound | Enum): Image;

        /**
         * Transform srgb to hsv.
         * @return Output image.
         */
        sRGB2HSV(): Image;

        /**
         * Convert an srgb image to scrgb.
         * @return Output image.
         */
        sRGB2scRGB(): Image;

        /**
         * Convert scrgb to bw.
         * @param options Optional options.
         * @return Output image.
         */
        scRGB2BW(options?: {
            /**
             * Output device space depth in bits.
             */
            depth?: number
        }): Image;

        /**
         * Transform scrgb to xyz.
         * @return Output image.
         */
        scRGB2XYZ(): Image;

        /**
         * Convert scrgb to srgb.
         * @param options Optional options.
         * @return Output image.
         */
        scRGB2sRGB(options?: {
            /**
             * Output device space depth in bits.
             */
            depth?: number
        }): Image;

        /**
         * Scale an image to uchar.
         * @param options Optional options.
         * @return Output image.
         */
        scale(options?: {
            /**
             * Exponent for log scale.
             */
            exp?: number
            /**
             * Log scale.
             */
            log?: boolean
        }): Image;

        /**
         * Scharr edge detector.
         * @return Output image.
         */
        scharr(): Image;

        /**
         * Check sequential access.
         * @param options Optional options.
         * @return Output image.
         */
        sequential(options?: {
            /**
             * Tile height in pixels.
             */
            tile_height?: number
        }): Image;

        /**
         * Unsharp masking for print.
         * @param options Optional options.
         * @return Output image.
         */
        sharpen(options?: {
            /**
             * Sigma of gaussian.
             */
            sigma?: number
            /**
             * Flat/jaggy threshold.
             */
            x1?: number
            /**
             * Maximum brightening.
             */
            y2?: number
            /**
             * Maximum darkening.
             */
            y3?: number
            /**
             * Slope for flat areas.
             */
            m1?: number
            /**
             * Slope for jaggy areas.
             */
            m2?: number
        }): Image;

        /**
         * Shrink an image.
         * @param hshrink Horizontal shrink factor.
         * @param vshrink Vertical shrink factor.
         * @param options Optional options.
         * @return Output image.
         */
        shrink(hshrink: number, vshrink: number, options?: {
            /**
             * Round-up output dimensions.
             */
            ceil?: boolean
        }): Image;

        /**
         * Shrink an image horizontally.
         * @param hshrink Horizontal shrink factor.
         * @param options Optional options.
         * @return Output image.
         */
        shrinkh(hshrink: number, options?: {
            /**
             * Round-up output dimensions.
             */
            ceil?: boolean
        }): Image;

        /**
         * Shrink an image vertically.
         * @param vshrink Vertical shrink factor.
         * @param options Optional options.
         * @return Output image.
         */
        shrinkv(vshrink: number, options?: {
            /**
             * Round-up output dimensions.
             */
            ceil?: boolean
        }): Image;

        /**
         * Unit vector of pixel.
         * @return Output image.
         */
        sign(): Image;

        /**
         * Similarity transform of an image.
         * @param options Optional options.
         * @return Output image.
         */
        similarity(options?: {
            /**
             * Scale by this factor.
             */
            scale?: number
            /**
             * Rotate clockwise by this many degrees.
             */
            angle?: number
            /**
             * Interpolate pixels with this.
             */
            interpolate?: Interpolate
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Horizontal output displacement.
             */
            odx?: number
            /**
             * Vertical output displacement.
             */
            ody?: number
            /**
             * Horizontal input displacement.
             */
            idx?: number
            /**
             * Vertical input displacement.
             */
            idy?: number
        }): Image;

        /**
         * Extract an area from an image.
         * @param width Width of extract area.
         * @param height Height of extract area.
         * @param options Optional options.
         * @return Output image.
         */
        smartcrop(width: number, height: number, options?: {
            /**
             * How to measure interestingness.
             */
            interesting?: Interesting | Enum
            /**
             * Input image already has premultiplied alpha.
             */
            premultiplied?: boolean
            /**
             * Horizontal position of attention centre (output).
             */
            attention_x?: number | undefined
            /**
             * Vertical position of attention centre (output).
             */
            attention_y?: number | undefined
        }): Image;

        /**
         * Sobel edge detector.
         * @return Output image.
         */
        sobel(): Image;

        /**
         * Spatial correlation.
         * @param ref Input reference image.
         * @return Output image.
         */
        spcor(ref: Image | ArrayConstant): Image;

        /**
         * Make displayable power spectrum.
         * @return Output image.
         */
        spectrum(): Image;

        /**
         * Find many image stats.
         * @return Output array of statistics.
         */
        stats(): Image;

        /**
         * Statistical difference.
         * @param width Window width in pixels.
         * @param height Window height in pixels.
         * @param options Optional options.
         * @return Output image.
         */
        stdif(width: number, height: number, options?: {
            /**
             * New deviation.
             */
            s0?: number
            /**
             * Weight of new deviation.
             */
            b?: number
            /**
             * New mean.
             */
            m0?: number
            /**
             * Weight of new mean.
             */
            a?: number
        }): Image;

        /**
         * Subsample an image.
         * @param xfac Horizontal subsample factor.
         * @param yfac Vertical subsample factor.
         * @param options Optional options.
         * @return Output image.
         */
        subsample(xfac: number, yfac: number, options?: {
            /**
             * Point sample.
             */
            point?: boolean
        }): Image;

        /**
         * Subtract two images.
         * @param right Right-hand image argument.
         * @return Output image.
         */
        subtract(right: Image | ArrayConstant): Image;

        /**
         * Generate thumbnail from image.
         * @param width Size to this width.
         * @param options Optional options.
         * @return Output image.
         */
        thumbnailImage(width: number, options?: {
            /**
             * Size to this height.
             */
            height?: number
            /**
             * Only upsize, only downsize, or both.
             */
            size?: Size | Enum
            /**
             * Don't use orientation tags to rotate image upright.
             */
            no_rotate?: boolean
            /**
             * Reduce to fill target rectangle, then crop.
             */
            crop?: Interesting | Enum
            /**
             * Reduce in linear light.
             */
            linear?: boolean
            /**
             * Fallback input profile.
             */
            input_profile?: string
            /**
             * Fallback output profile.
             */
            output_profile?: string
            /**
             * Rendering intent.
             */
            intent?: Intent | Enum
            /**
             * Error level to fail on.
             */
            fail_on?: FailOn | Enum
        }): Image;

        /**
         * Save image to tiff file.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        tiffsave(filename: string, options?: {
            /**
             * Compression for this file.
             */
            compression?: ForeignTiffCompression | Enum
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Compression prediction.
             */
            predictor?: ForeignTiffPredictor | Enum
            /**
             * Write a tiled tiff.
             */
            tile?: boolean
            /**
             * Tile width in pixels.
             */
            tile_width?: number
            /**
             * Tile height in pixels.
             */
            tile_height?: number
            /**
             * Write a pyramidal tiff.
             */
            pyramid?: boolean
            /**
             * Use 0 for white in 1-bit images.
             */
            miniswhite?: boolean
            /**
             * Write as a 1, 2, 4 or 8 bit image.
             */
            bitdepth?: number
            /**
             * Resolution unit.
             */
            resunit?: ForeignTiffResunit | Enum
            /**
             * Horizontal resolution in pixels/mm.
             */
            xres?: number
            /**
             * Vertical resolution in pixels/mm.
             */
            yres?: number
            /**
             * Write a bigtiff image.
             */
            bigtiff?: boolean
            /**
             * Write a properties document to imagedescription.
             */
            properties?: boolean
            /**
             * Method to shrink regions.
             */
            region_shrink?: RegionShrink | Enum
            /**
             * Deflate (1-9, default 6) or zstd (1-22, default 9) compression level.
             */
            level?: number
            /**
             * Enable webp lossless mode.
             */
            lossless?: boolean
            /**
             * Pyramid depth.
             */
            depth?: ForeignDzDepth | Enum
            /**
             * Save pyr layers as sub-ifds.
             */
            subifd?: boolean
            /**
             * Save with premultiplied alpha.
             */
            premultiply?: boolean
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to tiff buffer.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        tiffsaveBuffer(options?: {
            /**
             * Compression for this file.
             */
            compression?: ForeignTiffCompression | Enum
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Compression prediction.
             */
            predictor?: ForeignTiffPredictor | Enum
            /**
             * Write a tiled tiff.
             */
            tile?: boolean
            /**
             * Tile width in pixels.
             */
            tile_width?: number
            /**
             * Tile height in pixels.
             */
            tile_height?: number
            /**
             * Write a pyramidal tiff.
             */
            pyramid?: boolean
            /**
             * Use 0 for white in 1-bit images.
             */
            miniswhite?: boolean
            /**
             * Write as a 1, 2, 4 or 8 bit image.
             */
            bitdepth?: number
            /**
             * Resolution unit.
             */
            resunit?: ForeignTiffResunit | Enum
            /**
             * Horizontal resolution in pixels/mm.
             */
            xres?: number
            /**
             * Vertical resolution in pixels/mm.
             */
            yres?: number
            /**
             * Write a bigtiff image.
             */
            bigtiff?: boolean
            /**
             * Write a properties document to imagedescription.
             */
            properties?: boolean
            /**
             * Method to shrink regions.
             */
            region_shrink?: RegionShrink | Enum
            /**
             * Deflate (1-9, default 6) or zstd (1-22, default 9) compression level.
             */
            level?: number
            /**
             * Enable webp lossless mode.
             */
            lossless?: boolean
            /**
             * Pyramid depth.
             */
            depth?: ForeignDzDepth | Enum
            /**
             * Save pyr layers as sub-ifds.
             */
            subifd?: boolean
            /**
             * Save with premultiplied alpha.
             */
            premultiply?: boolean
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image to tiff target.
         * @param target Target to save to.
         * @param options Optional options.
         */
        tiffsaveTarget(target: Target, options?: {
            /**
             * Compression for this file.
             */
            compression?: ForeignTiffCompression | Enum
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Compression prediction.
             */
            predictor?: ForeignTiffPredictor | Enum
            /**
             * Write a tiled tiff.
             */
            tile?: boolean
            /**
             * Tile width in pixels.
             */
            tile_width?: number
            /**
             * Tile height in pixels.
             */
            tile_height?: number
            /**
             * Write a pyramidal tiff.
             */
            pyramid?: boolean
            /**
             * Use 0 for white in 1-bit images.
             */
            miniswhite?: boolean
            /**
             * Write as a 1, 2, 4 or 8 bit image.
             */
            bitdepth?: number
            /**
             * Resolution unit.
             */
            resunit?: ForeignTiffResunit | Enum
            /**
             * Horizontal resolution in pixels/mm.
             */
            xres?: number
            /**
             * Vertical resolution in pixels/mm.
             */
            yres?: number
            /**
             * Write a bigtiff image.
             */
            bigtiff?: boolean
            /**
             * Write a properties document to imagedescription.
             */
            properties?: boolean
            /**
             * Method to shrink regions.
             */
            region_shrink?: RegionShrink | Enum
            /**
             * Deflate (1-9, default 6) or zstd (1-22, default 9) compression level.
             */
            level?: number
            /**
             * Enable webp lossless mode.
             */
            lossless?: boolean
            /**
             * Pyramid depth.
             */
            depth?: ForeignDzDepth | Enum
            /**
             * Save pyr layers as sub-ifds.
             */
            subifd?: boolean
            /**
             * Save with premultiplied alpha.
             */
            premultiply?: boolean
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Cache an image as a set of tiles.
         * @param options Optional options.
         * @return Output image.
         */
        tilecache(options?: {
            /**
             * Tile width in pixels.
             */
            tile_width?: number
            /**
             * Tile height in pixels.
             */
            tile_height?: number
            /**
             * Maximum number of tiles to cache.
             */
            max_tiles?: number
            /**
             * Expected access pattern.
             */
            access?: Access | Enum
            /**
             * Allow threaded access.
             */
            threaded?: boolean
            /**
             * Keep cache between evaluations.
             */
            persistent?: boolean
        }): Image;

        /**
         * Transpose3d an image.
         * @param options Optional options.
         * @return Output image.
         */
        transpose3d(options?: {
            /**
             * Height of each input page.
             */
            page_height?: number
        }): Image;

        /**
         * Transform uhdr to scrgb.
         * @return Output image.
         */
        uhdr2scRGB(): Image;

        /**
         * Save image in ultrahdr format.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        uhdrsave(filename: string, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image in ultrahdr format.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        uhdrsaveBuffer(options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image in ultrahdr format.
         * @param target Target to save to.
         * @param options Optional options.
         */
        uhdrsaveTarget(target: Target, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Unpremultiply image alpha.
         * @param options Optional options.
         * @return Output image.
         */
        unpremultiply(options?: {
            /**
             * Maximum value of alpha channel.
             */
            max_alpha?: number
            /**
             * Unpremultiply with this alpha.
             */
            alpha_band?: number
        }): Image;

        /**
         * Save image to file in vips format.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        vipssave(filename: string, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save image to target in vips format.
         * @param target Target to save to.
         * @param options Optional options.
         */
        vipssaveTarget(target: Target, options?: {
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save as webp.
         * @param filename Filename to save to.
         * @param options Optional options.
         */
        webpsave(filename: string, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Preserve color values from transparent pixels.
             */
            exact?: boolean
            /**
             * Preset for lossy compression.
             */
            preset?: ForeignWebpPreset | Enum
            /**
             * Enable high quality chroma subsampling.
             */
            smart_subsample?: boolean
            /**
             * Enable preprocessing in lossless mode (uses q).
             */
            near_lossless?: boolean
            /**
             * Change alpha plane fidelity for lossy compression.
             */
            alpha_q?: number
            /**
             * Optimise for minimum size.
             */
            min_size?: boolean
            /**
             * Minimum number of frames between key frames.
             */
            kmin?: number
            /**
             * Maximum number of frames between key frames.
             */
            kmax?: number
            /**
             * Level of cpu effort to reduce file size.
             */
            effort?: number
            /**
             * Desired target size in bytes.
             */
            target_size?: number
            /**
             * Allow mixed encoding (might reduce file size).
             */
            mixed?: boolean
            /**
             * Enable auto-adjusting of the deblocking filter.
             */
            smart_deblock?: boolean
            /**
             * Number of entropy-analysis passes (in [1..10]).
             */
            passes?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save as webp.
         * @param options Optional options.
         * @return Buffer to save to.
         */
        webpsaveBuffer(options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Preserve color values from transparent pixels.
             */
            exact?: boolean
            /**
             * Preset for lossy compression.
             */
            preset?: ForeignWebpPreset | Enum
            /**
             * Enable high quality chroma subsampling.
             */
            smart_subsample?: boolean
            /**
             * Enable preprocessing in lossless mode (uses q).
             */
            near_lossless?: boolean
            /**
             * Change alpha plane fidelity for lossy compression.
             */
            alpha_q?: number
            /**
             * Optimise for minimum size.
             */
            min_size?: boolean
            /**
             * Minimum number of frames between key frames.
             */
            kmin?: number
            /**
             * Maximum number of frames between key frames.
             */
            kmax?: number
            /**
             * Level of cpu effort to reduce file size.
             */
            effort?: number
            /**
             * Desired target size in bytes.
             */
            target_size?: number
            /**
             * Allow mixed encoding (might reduce file size).
             */
            mixed?: boolean
            /**
             * Enable auto-adjusting of the deblocking filter.
             */
            smart_deblock?: boolean
            /**
             * Number of entropy-analysis passes (in [1..10]).
             */
            passes?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): Uint8Array;

        /**
         * Save image to webp mime.
         * @param options Optional options.
         */
        webpsaveMime(options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Preserve color values from transparent pixels.
             */
            exact?: boolean
            /**
             * Preset for lossy compression.
             */
            preset?: ForeignWebpPreset | Enum
            /**
             * Enable high quality chroma subsampling.
             */
            smart_subsample?: boolean
            /**
             * Enable preprocessing in lossless mode (uses q).
             */
            near_lossless?: boolean
            /**
             * Change alpha plane fidelity for lossy compression.
             */
            alpha_q?: number
            /**
             * Optimise for minimum size.
             */
            min_size?: boolean
            /**
             * Minimum number of frames between key frames.
             */
            kmin?: number
            /**
             * Maximum number of frames between key frames.
             */
            kmax?: number
            /**
             * Level of cpu effort to reduce file size.
             */
            effort?: number
            /**
             * Desired target size in bytes.
             */
            target_size?: number
            /**
             * Allow mixed encoding (might reduce file size).
             */
            mixed?: boolean
            /**
             * Enable auto-adjusting of the deblocking filter.
             */
            smart_deblock?: boolean
            /**
             * Number of entropy-analysis passes (in [1..10]).
             */
            passes?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Save as webp.
         * @param target Target to save to.
         * @param options Optional options.
         */
        webpsaveTarget(target: Target, options?: {
            /**
             * Q factor.
             */
            Q?: number
            /**
             * Enable lossless compression.
             */
            lossless?: boolean
            /**
             * Preserve color values from transparent pixels.
             */
            exact?: boolean
            /**
             * Preset for lossy compression.
             */
            preset?: ForeignWebpPreset | Enum
            /**
             * Enable high quality chroma subsampling.
             */
            smart_subsample?: boolean
            /**
             * Enable preprocessing in lossless mode (uses q).
             */
            near_lossless?: boolean
            /**
             * Change alpha plane fidelity for lossy compression.
             */
            alpha_q?: number
            /**
             * Optimise for minimum size.
             */
            min_size?: boolean
            /**
             * Minimum number of frames between key frames.
             */
            kmin?: number
            /**
             * Maximum number of frames between key frames.
             */
            kmax?: number
            /**
             * Level of cpu effort to reduce file size.
             */
            effort?: number
            /**
             * Desired target size in bytes.
             */
            target_size?: number
            /**
             * Allow mixed encoding (might reduce file size).
             */
            mixed?: boolean
            /**
             * Enable auto-adjusting of the deblocking filter.
             */
            smart_deblock?: boolean
            /**
             * Number of entropy-analysis passes (in [1..10]).
             */
            passes?: number
            /**
             * Which metadata to retain.
             */
            keep?: ForeignKeep | Flag
            /**
             * Background value.
             */
            background?: ArrayConstant
            /**
             * Set page height for multipage save.
             */
            page_height?: number
            /**
             * Filename of icc profile to embed.
             */
            profile?: string
        }): void;

        /**
         * Wrap image origin.
         * @param options Optional options.
         * @return Output image.
         */
        wrap(options?: {
            /**
             * Left edge of input in output.
             */
            x?: number
            /**
             * Top edge of input in output.
             */
            y?: number
        }): Image;

        /**
         * Zoom an image.
         * @param xfac Horizontal zoom factor.
         * @param yfac Vertical zoom factor.
         * @return Output image.
         */
        zoom(xfac: number, yfac: number): Image;
    }

    //#endregion

}

export = Vips;
