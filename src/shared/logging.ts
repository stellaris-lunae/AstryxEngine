class C_Logger {
	/** @hidden */
	log_internal = (prefix: string, ...args: unknown[]) => {
		const [source, line] = debug.info(3, "sl") as LuaTuple<[string, number]>;
		const first = string.match(source, "^([^.]+)")[0];
		const last = string.match(source, "([^.]+)$")[0];
		const short_source = first !== last ? `${first}.${last}` : first;
		print(`\n${prefix} [${os.date("%I:%M")}] [${short_source}:${line}]`, ...args);
	};

	log_info = (...args: unknown[]) => {
		this.log_internal("[+]", ...args);
	};

	log_warn = (...args: unknown[]) => {
		this.log_internal("[/]", ...args);
	};

	log_error = (...args: unknown[]) => {
		this.log_internal("[-]", ...args);
	};
}

const S_AstryxLogger = new C_Logger();
export default S_AstryxLogger;
