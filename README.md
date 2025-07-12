# System Logger Plugin

A plugin for **HugeTicket** that listens to internal system-level errors and logs them to disk using [Winston](https://github.com/winstonjs/winston).

---

## What It Does

The System Logger plugin listens for errors triggered by the HugeTicket backend using the `system:error_occurred` lifecycle hook. It writes those errors to a log file on disk with context like:

* Stack trace
* HTTP method and path
* Authenticated user (if available)

This is useful for debugging production issues without exposing them in the API response or console.

---

## How It Works

1. Core errors (from `catchAsync`, global error handler, etc.) trigger a lifecycle hook:

```ts
await trigger(HOOKS.SYSTEM_ERROR_OCCURRED, {
  action: "system_error_occurred",
  error,
  req: {
    method: req.method,
    url: req.originalUrl,
    user: req.user && {
      id: req.user._id.toString(),
      role: req.user.role,
    },
  },
});
```

2. The plugin listens for that hook and logs it using Winston:

```ts
on(HOOKS.SYSTEM_ERROR_OCCURRED, async ({ error, req }) => {
  logger.error(error, {
    context: req ? `${req.method} ${req.url}` : undefined,
    user: req?.user,
  });
});
```

3. Logs are saved to:

```
/logs/system-errors.log
```

---

## Plugin Folder Structure

```
system-logger/
├── core/
│   └── logger.ts            # Winston logger instance
│
├── config/
│   └── log-config.ts        # File path, level, directory setup
│
├── handlers/
│   └── onSystemError.ts     # Hook handler for system:error_occurred
│
├── types/
│   └── extend-hook-types.d.ts  # Optional TypeScript augmentation
│
└── index.ts                 # Plugin entry (registers hook)
```

---

## Hook: `system:error_occurred`

This plugin listens to `HOOKS.SYSTEM_ERROR_OCCURRED`.

### Payload Structure

```ts
{
  action: "system_error_occurred";
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

All fields are passed from the Express error middleware (or wherever the error occurs).

---

## Log Output Example

```
[2025-07-07 18:42:17] ERROR:
Error: Failed to assign folder
    at createTicket (/src/controllers/ticket.controller.ts:42:13)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
Request: POST /api/tickets | User: 686a8aef52340c5d8800c62e (admin)
```

---

## What This Plugin **Does Not** Do

* No routes or REST API.
* No UI.
* No core database changes.
* No third-party services.
* No access to the Express app.

It silently listens and logs.

---

## How to Use in Core

Trigger the hook from anywhere (global error middleware, service, controller):

```ts
await trigger(HOOKS.SYSTEM_ERROR_OCCURRED, {
  action: "system_error_occurred",
  error,
  req: {
    method: req.method,
    url: req.originalUrl,
    user: req.user && {
      id: req.user._id.toString(),
      role: req.user.role,
    },
  },
});
```

---

## How to Extend: Core vs Plugin-Side

### Option A: Extend Inside Plugin (No Core Touch)

If you don’t want to modify HugeTicket's core files, extend the hook payload from inside the plugin:

```ts
// plugins/system-logger/types/extend-hook-types.d.ts

import type { HookPayloadMap } from "@plugin-core/hooks";

declare module "@plugin-core/hooks" {
  interface HookPayloadMap {
    [HOOKS.SYSTEM_ERROR_OCCURRED]: {
      action: "system_error_occurred";
      error: Error;
      req?: {
        method: string;
        url: string;
        user?: {
          id: string;
          role: string;
        };
      };
    };
  }
}
```

That’s all. This works via TypeScript’s module augmentation and doesn’t need any change in `hook-types.ts`.

> Useful when building third-party plugins or marketplace plugins.

---

### Option B: Modify Hook Types in Core

If this plugin is bundled with core and you want the hook available globally:

1. Update `hook-constants.ts`:

```ts
export const HOOKS = {
  ...,
  SYSTEM_ERROR_OCCURRED: "system:error_occurred",
};
```

2. Add to `hook-types.ts`:

```ts
[HOOKS.SYSTEM_ERROR_OCCURRED]: {
  action: "system_error_occurred";
  error: Error;
  req?: {
    method: string;
    url: string;
    user?: {
      id: string;
      role: string;
    };
  };
};
```

> Recommended only for internal plugins tightly coupled with HugeTicket.

---

## Adding More Handlers

Want to listen to more hooks in this plugin? Just add a new file inside `handlers/`.

Example:

```ts
// system-logger/handlers/onTicketDeleted.ts
on(HOOKS.TICKET_DELETED, async ({ ticketId, userId }) => {
  logger.warn(`Ticket ${ticketId} deleted by ${userId}`);
});
```

That’s it. No plugin loader changes required.

---

## Dependencies

* Winston (already installed in HugeTicket root)

---

## Final Notes

* Logs go to `/logs/system-errors.log`
* Plugin is passive — no API or route.
* Can be cleanly removed from `package.json` plugins list if needed.
