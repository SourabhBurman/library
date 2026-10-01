import pino from "pino";

/**
 * The one logger instance for the whole app. Everything else (the HTTP
 * request logger, per-request child loggers, resolver-level logging)
 * derives from this — so log level and redaction rules only need to be
 * configured once, here.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Human-readable, colorized output in dev; raw newline-delimited JSON in
  // production (that's the format log-aggregation services — Better Stack,
  // Axiom, CloudWatch, etc. — actually expect to parse).
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },

  // Never let a password, token, or secret end up in a log line — this is
  // a real, common cause of security incidents (breached log dashboards
  // leaking plaintext credentials). List every path a sensitive value
  // could appear at; pino replaces the value with "[Redacted]" instead of
  // omitting the key, so you can still see *that* a field was present.
  //
  // Note there's no "req.body.*" path here: the request body is never part
  // of the automatic HTTP access log (see the comment on `pinoHttp(...)` in
  // app.ts for why — pino serializes a request's bound fields the moment
  // the request arrives, before body-parsing middleware has run, so it's
  // structurally impossible to capture `req.body` that way). Instead,
  // handlers log specific, deliberately-chosen fields themselves (e.g.
  // `email`, never `password`) — these wildcard paths are what protect
  // *that* logging if a raw object ever gets passed in by mistake.
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "*.password",
      "*.refreshTokenHash",
      "*.resetPasswordTokenHash",
    ],
    censor: "[Redacted]",
  },
});
