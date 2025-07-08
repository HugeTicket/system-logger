import { HOOKS } from "@plugins-core/hooks/hook-constants";
import { registerHook } from "@plugins-core/hooks/hook-registry";
import logger from "../core/logger";

registerHook(HOOKS.SYSTEM_ERROR_OCCURRED, async ({ error, req }) => {
	if (!error) return;

	let context = "";

	if (req) {
		const { method, url, user } = req;
		context += `\nRequest: ${method} ${url}`;
		if (user) {
			context += ` | User: ${user.id} (${user.role})`;
		}
	}

	logger.error(`${error.stack || error.message}${context}`);
});
