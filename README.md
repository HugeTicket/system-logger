## System Logger Plugin

A plugin for HugeTicket that logs internal system-level errors to disk using [Winston](https://github.com/winstonjs/winston).

---

### What It Does

The System Logger plugin listens for system-level errors via a lifecycle hook and writes them to a persistent log file. This allows you to debug unexpected failures, stack traces, and critical issues without polluting user-facing output.

---

### How It Works

1. The plugin registers a listener on the `system:error_occurred` hook.
2. When a core service calls:

```ts
await runHook(HOOKS["system:error_occurred"], { error, req });
```

…the plugin logs the error stack trace and optional request context.
3\. Logs are saved to a file:
`/logs/system-errors.log`

---

### 📁 Folder Structure

```
system-logger/
├── core/
│   └── logger.ts            # Winston logger instance
│
├── config/
│   └── log-config.ts        # Log file path, log level, log directory
│
├── hooks/
│   └── error-hooks.ts       # Hook handler for system:error_occurred
│
└── index.ts                 # Plugin entry point (registers hooks)
```

---

### 🪝 Hook: `system:error_occurred`

#### Payload structure:

```ts
{
  error: Error;
  req?: {
    method: string;
    url: string;
    user?: {
      id: string;
      role: string;
    };
  };
}
```

The plugin will log:

* Stack trace (`error.stack`)
* Request method and URL (if provided)
* Authenticated user info (if available)

---

### 📝 Log Format (example)

```
[2025-07-07 18:42:17] ERROR:
Error: Something went wrong
    at createTicket (/src/controllers/ticket.controller.ts:42:13)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
Request: POST /api/tickets | User: 686a8aef52340c5d8800c62e (admin)
```

---

### 🚀 Usage in Core

To log an error from anywhere in your codebase:

```ts
await runHook(HOOKS["system:error_occurred"], {
  error,
  req: {
    method: req.method,
    url: req.originalUrl,
    user: req.user && {
      id: String(req.user._id),
      role: req.user.role,
    },
  },
});
```

> This can be placed inside `catchAsync`, global error handlers, or specific try/catch blocks.

---

### 🔐 No External Exposure

* This plugin does **not** expose any routes or UI
* It does not modify any models or application logic
* It runs silently in the background when the hook is triggered

---

### 📦 Dependencies

* `winston` (installed in the root backend app)

No need to install anything separately for this plugin to work.
